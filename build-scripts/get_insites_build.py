#!/usr/bin/env python3

# First party
import json
from urllib import request

def get_build_info(env, url):
    """
        Queries Evolon Slack Bot's server to retrieve build shas for provided environment argument.
    """

    # Converts dict to JSON string.
    data = json.dumps({ "env": env  })

    # Encodes string to utf-8
    data_encoded = data.encode()

    # Defining HTTP request.
    req = request.Request(f"{url}/aws/query-build", data=data_encoded)
    req.add_header('Content-Type', 'application/json')

    # Making request and saving response.
    resp = request.urlopen(req)
    
    return json.loads(resp.read())


def create_insites_build_message(env, url):
    """
        Creates a string featuring build shas of provided environment.
    """

    message = ""
    build_info = get_build_info(env, url)

    for k, v in build_info.items():
        message += f"""\n{k.replace("-", " ").upper()}: {v}"""

    return message


def main(env, url):
    print(create_insites_build_message(env, url))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('--url', type=str) # URL for Slack Bot server.
    parser.add_argument('--env', type=str, default='qa') # Environment for build query.
    args = parser.parse_args()

    main(args.env, args.url)