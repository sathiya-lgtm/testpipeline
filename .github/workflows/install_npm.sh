#!/bin/bash

# Update system
sudo apt update -y

# Install Node.js and npm (from Ubuntu repo)
sudo apt install -y nodejs npm

# Check versions
node -v
npm -v

# Go to your project folder
cd /path/to/your/project

# Install project dependencies
npm install
