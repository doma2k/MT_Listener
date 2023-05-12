# Use the official lightweight Node.js 14 image.
# https://hub.docker.com/_/node
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies.
RUN npm install --only=production

# Copy local code to the container image.
COPY . .

# Expose the port your app runs on
EXPOSE 8080

# Run the web service on container startup.
CMD [ "node", "main.js" ]
