# FROM node:18-alpine

# WORKDIR /app

# # Copy package.json and package-lock.json
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Copy ESLint and Vite configuration files
# COPY eslint.config.js vite.config.js ./

# # Copy the rest of the application
# COPY . .

# # Expose the port
# EXPOSE 3000

# # Start the Vite dev server with host and CORS settings
# CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY eslint.config.js vite.config.js ./
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
