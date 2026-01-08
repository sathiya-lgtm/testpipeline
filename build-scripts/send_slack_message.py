#!/usr/bin/env python3

# First party
import argparse
import json
from urllib import request
from sys import stderr

parser = argparse.ArgumentParser()
parser.add_argument('--url', type=str) # URL for Slack Bot server.
parser.add_argument('--path', type=str, default='slack_notification_data.json') # Location to find message JSON file.
args = parser.parse_args()

def read_file(filePath):
    f = open(filePath)
    data = json.load(f)

    return data


def send_message(data, url):
    # Converts dict to JSON string.
    data = json.dumps(data)

    # Encodes string to utf-8
    data_encoded = data.encode()

    # Defining HTTP request.
    req = request.Request(f"{url}/notifications/send-message", data=data_encoded)
    req.add_header('Content-Type', 'application/json')

    # Making request and saving response.
    resp = request.urlopen(req)
    
    return json.loads(resp.read())


def main():
    try:
        data = read_file(args.path)
        send_message(data, args.url)
    except Exception as error:
        print(error, file=stderr)
        
        # Will throw error to GitHub action.
        exit(1)


if __name__ == "__main__":
    main()