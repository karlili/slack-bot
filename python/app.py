import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the Slack app with your tokens
app = App(
    token=os.environ.get("SLACK_BOT_TOKEN"),
    # socket_mode=True,
    # app_token=os.environ.get("SLACK_APP_TOKEN")
)

# Get the project root directory
ROOT_DIR = Path(__file__).parent.parent
IMAGES_DIR = ROOT_DIR / "static" / "images"


def list_files_in_directory(directory_path):
    """
    Lists all files in a directory

    Args:
        directory_path (str or Path): The path to the directory to list files from

    Returns:
        list: Array of file objects with path and name
    """
    directory = Path(directory_path)
    if not directory.exists() or not directory.is_dir():
        logger.error(f"Directory does not exist: {directory}")
        return []

    file_list = []
    for file_path in directory.iterdir():
        if file_path.is_file():
            file_list.append({
                "path": str(file_path),
                "name": file_path.name,
                "description": f"File {file_path.name}"
            })

    return file_list


def get_images(image_path):
    """
    Gets all images from the static/images directory

    Returns:
        list: Array of image file objects
    """
    try:
        files = list_files_in_directory(image_path)

        # Filter to only include image files
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        image_files = [
            file for file in files
            if Path(file["path"]).suffix.lower() in image_extensions
        ]

        return image_files
    except Exception as e:
        logger.error(f"Error getting images: {e}")
        return []


# Handle slash command /hello
@app.command("/hello")
def handle_hello_command(ack, command, client):
    # Acknowledge command request
    ack()

    try:
        # First, post a parent message to create a thread
        parent_message = client.chat_postMessage(
            channel=command["channel_id"],
            text=f"<@{command['user_id']}>, hello",
            blocks=[
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"<@{command['user_id']}>, hello"
                    },
                    "accessory": {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Click Me"},
                        "action_id": "button_click"
                    }
                }
            ]
        )

    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        client.chat_postMessage(
            channel=command["channel_id"],
            text=f"Hello <@{command['user_id']}>! I tried to send you an image, but encountered an error."
        )


# Handle /generate command that replies in a thread with the provided text
@app.command("/generate")
def handle_generate_command(ack, command, client, respond):
    # Acknowledge command request
    ack()

    try:
        # If no text is provided, respond with a helpful message
        if not command["text"] or command["text"].strip() == "":
            respond({
                "text": "We do not accept empty parameter for the /generate command.",
                "response_type": "ephemeral"
            })
            return

        # Post a message in the channel where the command was invoked
        result = client.chat_postMessage(
            channel=command["channel_id"],
            text=f"<@{command['user_id']}> submitted the experiment",
            blocks=[
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"<@{command['user_id']}> submitted an experiment with the following parmeters"
                    },
                    "accessory": {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Rerun this experiment"},
                        "action_id": "rerun_experiment"
                    }
                }
            ],
            thread_ts=command.get("thread_ts")
        )

        # Reply in the thread with the text from the command
        # post_thread(result, command, client)

        # Also post images in the same thread
        image_list = get_images(
            '../static/images'
        )
        post_images_as_thread(result, command, client, image_list)

    except Exception as e:
        logger.error(f"Error handling /generate command: {e}")
        respond({
            "text": "An error occurred while processing your command.",
            "response_type": "ephemeral"
        })


def post_thread(original_message, original_command, client):
    """
    Posts a message in a thread

    Args:
        original_message (dict): The original message to reply to
        original_command (dict): The original command that triggered this
        client: The Slack client
    """
    try:
        client.chat_postMessage(
            channel=original_command["channel_id"],
            thread_ts=original_message["ts"],
            text=original_command["text"],
            blocks=[
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Generated content:*\n```{original_command['text']}```"
                    }
                }
            ]
        )
    except Exception as e:
        logger.error(f"Error posting thread: {e}")


def post_images_as_thread(original_message, original_command, client, specific_files=None):
    """
    Posts multiple images as replies in a thread

    Args:
        original_message (dict): The original message to reply to
        original_command (dict): The original command that triggered this
        client: The Slack client
        specific_files (list, optional): Optional list of specific file paths to upload
    """
    try:
        # Get files to upload - either use provided files or get all images
        files_to_upload = specific_files

        if not files_to_upload:
            logger.info("No files to upload")
            return

        # Upload each file to the thread
        for file in files_to_upload:
            with open(file["path"], "rb") as file_content:
                client.files_upload_v2(
                    channel=original_command["channel_id"],
                    thread_ts=original_message["ts"],
                    file=file_content,
                    filename=file["name"],
                    title=file.get("description", f"File {file['name']}")
                )

        logger.info(
            f"Successfully uploaded {len(files_to_upload)} files to the thread")

    except Exception as e:
        logger.error(f"Error uploading images to thread: {e}")


# Example of handling interactive buttons
@app.action("button_click")
def handle_button_click(ack, body, say):
    # Acknowledge the action
    ack()
    say(f"<@{body['user']['id']}> clicked the button")


@app.action("rerun_experiment")
def handle_button_click(ack, body, say):
    # Acknowledge the action
    ack()
    say(f"<@{body['user']['id']}> retrigger the experiment")


# Start your app
if __name__ == "__main__":
    handler = SocketModeHandler(app, os.environ["SLACK_APP_TOKEN"])
    handler.start()
