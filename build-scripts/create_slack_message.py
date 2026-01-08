#!/usr/bin/env python3

# First party
import argparse
import json
import re
import subprocess
from sys import stderr

# Custom
from get_insites_build import create_insites_build_message


parser = argparse.ArgumentParser()
parser.add_argument('--channel', type=str, default='bot-test') # Name of channel for sending Slack message.
parser.add_argument('--env', type=str, default='qa') # Environment for build query.
parser.add_argument('--url', type=str) # URL for Slack Bot server.
parser.add_argument('--log-depth', type=int, default=100) # Max count of results from git log.
parser.add_argument('--path', type=str, default='slack_notification_data.json') # Location to write message JSON file.
args = parser.parse_args()


def get_list_of_merged_branch_names(max_count):
    """
        Returns a list of branch names of branches directly or indirectly
        merged into the current branch.
    """
    git_log = subprocess.run(['git', 'log', '--merges', '--oneline', f"--max-count={max_count}"], stdout=subprocess.PIPE)\
        .stdout\
        .decode('utf-8')
    branch_names = re.findall("from .*/.*", git_log)

    # print(f"Found the following branch names from git log:\n{git_log}")

    return branch_names


def get_index_of_previous_merge_from_develop(branch_names):
    """
        Returns the first index of a branch named "develop" from
        list of branch names excluding the first branch name.

        This index can be used as a marker to identify the indexes of all branch names
        that came between the most recent merge and the last time a branch named "develop"
        was merged into current branch.
    """
    branch_names_excluding_most_recent_merge = branch_names[1:] # Truncates list to exclude most recent commit.

    for index, branch_name in enumerate(branch_names_excluding_most_recent_merge):
        if re.search(".*/develop$", branch_name):
            return index + 1 # Adds 1 to index because index is based on truncated list.
    
    raise Exception("Merge Commit from 'develop' branch not found.")


def get_task_info_from_branch_names(branch_names): 
    """
        Returns a sorted list of tuples featuring Click Up task IDs and names extracted
        from provided list of branch_names. Only identifies task IDs and corresponding
        names used in branch name when prefixed with "IST-"
    """
    task_info_dict = {}

    for branch_name in branch_names:    
        task_id_and_title_match_object = re.search("(IST-\d+)\D(.+)", branch_name)

        if task_id_and_title_match_object:
            task_id = task_id_and_title_match_object.group(1)
            task_name = task_id_and_title_match_object.group(2).replace("-", " ")

            task_info_dict[task_id] = task_name
    
    task_info_list = list(task_info_dict.items())
    task_info_list.sort()

    return task_info_list


def get_commit_author():
    """
        Gets author name of most recent commit.
    """
    git_log = subprocess.run(['git', 'show', 'HEAD'], stdout=subprocess.PIPE)\
        .stdout\
        .decode('utf-8')
    author_match_object = re.search(r"(?=Author: )[^<]+", git_log)

    if author_match_object == None:
        raise Exception(f"Author name not found in previous commit:\n{git_log}")
    
    author = author_match_object.group()\
        .strip()\
        .replace("Author: ", "")

    return author


def create_notification_message(task_info):
    """
        Creates a notification message formatted for Slack using
        provided ClickUp task IDs.

        @param task_info - A list of tuples featuring (task_id, task_name)
    """
    message = f"A new {args.env.upper()} build just went live for Insites UI.\n\n"
    message += f"Current {args.env.upper()} Insites build:\n```{create_insites_build_message(args.env, args.url)}```\n\n"

    if len(task_info) > 0:
        message += "The new build addresses the following tasks:"

        for task in task_info:
            message += f"\n * <https://app.clickup.com/t/31034582/{task[0]}|{task[0]}> - {task[1]}"
    else:
        message += f"Failed to identify ClickUp tasks addressed in this build. Contact {get_commit_author()} for more details on what was added."

    return message


def write_message_to_file(message):
    output_path = args.path
    slack_channel_name = args.channel

    with open(output_path, "w") as json_file:
        json.dump({ "text": message, "channel": slack_channel_name }, json_file)


def main():
    try:
        merged_branch_names = get_list_of_merged_branch_names(args.log_depth)
        index_of_previous_merge_from_develop = get_index_of_previous_merge_from_develop(merged_branch_names)
        merged_branch_names_since_previous_merge_from_develop = merged_branch_names[:index_of_previous_merge_from_develop]
        task_info = get_task_info_from_branch_names(merged_branch_names_since_previous_merge_from_develop)
        notification_message = create_notification_message(task_info)

        write_message_to_file(notification_message)
        print(f"Created the following Slack message:\n{notification_message}")
    except Exception as error:
        print(error, file=stderr)
        
        # Will throw error to GitHub action.
        exit(1)


if __name__ == '__main__':
    main()
