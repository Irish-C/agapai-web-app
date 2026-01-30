# AGAPAI WEB APP

This repository contains the source code for the AGAPAI web application. 
Below are the [Instructions](#table-of-contents) to set up the development environmen and run the application locally.

To know more about the App looks and features → [AGAPAI Web App](APP.md)



# Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development Setup](#development-setup)
- [Contribution](#contribution)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Frontend](#frontend)
- [Backend](#backend)
- [Key components](#key-components)
- [Pages](#pages)
- [License](#license)
- [References](#references)



# Prerequisites
Before you begin, ensure you have the following installed:
- `Node.js`: v18.0.0 or higher
- `Python`: 3.10+ (for ML/Hardware services)
- Database: Access to a database compatible with `Prisma` (PostgreSQL/SQLite)
- `Git`: For version control



# Installation
1. Clone the Repository.
   ```bash
   git clone https://github.com/Irish-C/agapai-web-app.git
   cd agapai-web-app
   npm install
    ```
2. Install Root and Backend Dependencies.
   ```bash
   cd server
   pip install -r requirements.txt
   ```
  
3. Install Frontend Dependencies:
    ```bash
    cd client && npm install
    ```

4. Environment Variables: Create a .env file in the root directory and add your database URL
    ```env
    DATABASE_URL="your_database_url_here"
    ```

5. Database Migration: Run Prisma migrations to set up the database schema.
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```


# Development Setup
The project uses concurrently to run both the Express server and the Vite frontend with a single command.
```bash
npm run start
```
- API Server: Running on http://localhost:3000
- Vite Client: Running on http://localhost:5173 (Proxied to API)



# Contribution
### How to Contribute (as project member)
1. Clone the repository and create a new branch for your feature or bug fix.
2. Make your changes and ensure the code follows the project's coding standards.
3. Test your changes thoroughly.
4. Commit your changes with clear and descriptive messages. See [SEMANTICS](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716).
5. Reference any related issues or tickets in the commit message.
6. Push your branch to the remote repository.
7. Create a pull request for review and merging.



# Architecture

MVC Architecture is used to separate concerns and organize the codebase effectively.

| Stack | Layer | Use |
|------|------------|---------|
| NodeJS + ExpressJS | Server | Backend API server & business logic |
| React + Vite | Client | Frontend application for user interface |
| Prisma ORM | Database | Database modeling & migrations |
| Socket.IO | Presentation | WebSocket communication for live camera feeds & alerts |



# Project Structure

## Root
The root.
```
agapai-web-app/
├── .env.example                     # Example environment variables
├── index.html                       # Main HTML file
├── .gitignore                       # Git ignore rules
├── package.json                     # NPM dependencies & scripts
└── README.md                        # Project documentation
```


## Frontend
The client side uses React with Vite.
```
agapai-web-app/
└── client/                          # React + Vite frontend
    ├── public/                      # Static assets (index.html, icons)
    ├── src/
    │   ├── assets/                  # Images, branding, backgrounds
    │   ├── components/
    │   │   └── layout/              # Global UI (Navbar, Header, footer)
    │   ├── features/                # Feature-based modules (domain logic)
    │   ├── hooks/                   # Custom React hooks (API, sockets)
    │   ├── pages/                   # Route-level pages / views
    │   ├── services/                # API clients & reusable logic
    │   └── theme/                   # Tailwind config, tokens, globals
    └── vite.config.ts               # Vite configuration
```
### Main Features 
(src/features/)
- `camera/` for camera feedback features.
- `dashboard/` for viewing camera feeds and alerts
- `manager/` for managing cameras, locations, and users.

### Forms & Modals 
(src/features/)
- `forms/` for adding, editing, and deleting cameras and locations
- `modals/` for user authentication and management

### Auth and Alerts 
(src/features/)
- `auth/` for authentication system (login, logout, user management)
- `alerts/` for real-time alerts and notifications for camera feeds and system events

### Services 
(src/services/)
- `api/` for API client services to interact with the backend
- `sockets/` for Socket.IO client services for real-time communication



## Backend
The server side uses Node.js with Express.
```
agapai-web-app/
└── server/                          # Express / Node.js backend
    ├── prisma/                      # Prisma schema & migrations
    ├── hardware/                    # Hardware-related logic/modules
    ├── ml/                          # Machine learning models / scripts
    ├── src/
    │   ├── controllers/             # Request handlers
    │   ├── middlewares/             # Auth, validation, error handling
    │   ├── models/                  # Data models / ORM mappings
    │   ├── routes/                  # API route definitions
    │   ├── services/                # Business logic layer
    │   └── utils/                   # Shared helpers & utilities
    └── index.ts                     # Server entry point
```


# Key Components
##  Routing
- Frontend: React Router is used for client-side routing.
- Backend: Express Router is used for defining API endpoints.

## State Management
- React Context API is used for global state management.

## API Communication
- `Axios` is used for making HTTP requests from the frontend to the backend API.
- `Socket.IO` is used for real-time communication (camera feeds, alerts).

## Theme
- Tailwind CSS is used for styling and theming the application.
- Custom themes and tokens are defined in the `theme/` folder.



# PAGES

### Main
- ✅`LoginPage` for user authentication.
- ✅`LandingPage` for information about the app.
- ✅`MainPage` for viewing camera feeds and alerts.
- ✅`SettingsPage` for application settings and configurations.
- ✅`ReportsPage` for viewing system reports and analytics.

### Settings
- ✅`ProfileView` for user profile management.
- 🔄`HelpView` for user assistance and documentation.
- 🔄`NotificationsView` for managing alerts and notifications.
- 🔄`SupportView` for customer support and contact.
- 🔄`FeedbackView` for user feedback and suggestions.
- 🔄`ActivityLogView` for tracking user activities and changes.

### Information
- 🔄`AboutView` for information about the application and team.
- 🔄`FAQView` for frequently asked questions and answers.
- 🔄`TermsView` for terms of service and legal information.
- 🔄`PrivacyPolicyView` for privacy policy details.

### Miscellaneous
- 🔄`NotFoundPage` for handling 404 errors.
- 🔄`UpdatePage` for application updates and release notes.



# License
This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.



# Thank You
- [Avinava's Template](https://github.com/Avinava/simple-vite-react-express)
- [Josh Buchea's Commit Semantics](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716)
