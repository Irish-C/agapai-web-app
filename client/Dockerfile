FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# runs the simplified "vite build"
FROM nginx:stable-alpine
# Copy your custom config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy the React files
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]