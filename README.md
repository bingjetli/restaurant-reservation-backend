# Restaurant Reservation Backend
This is the backend server for the restaurant reservation system I created for Vu Restaurants as a portfolio project. This project was meant to further reinforce the concepts learned in my Web Development course taken at Memorial University of Newfoundland as well as implementing it in a professional workflow which included Git version control and Linux server deployment.

During this project, I learned to incorporate the usage of `dotenv (.env)` files to manage environmental variables to avoid hard-coding API secrets and other sensitive information in the project source code. I also began to familiarize myself more with Git's version control system, using `.gitignore` to avoid uploading certain files to the repository as well as using private access keys to download the repository on the deployment environment.

I've also learned a little on how to setup the deployment environment in linux, specifically creating `.service` files for `systemd` in order to enable this node.js server as an auto-start service as well as setting up HTTPS certification with certbot.

# Features
- REST API backend server using a modern web development stack (MongoDB, Express.js, React, Node.js)
- HTTP and HTTPS for both local and remote endpoints respectively.
- Standard HTTP request methods implemented for each endpoint, POST, GET, PUT, DELETE -> CREATE, READ, UPDATE, DELETE
- All endpoints return data in standard JSON format
- Accessing the endpoints require an API-KEY sent in the HTTP headers for extremely basic access control. Ideally I should have implemented something like OAuth2 for more reliable security.
- The DELETE route handles deletes by updating a flag for the item specified by default (soft-delete) but allows specifying a flag in the request to permanently remove the record in the database. The idea was to provide a user experience for the frontend which accomplished basic delete functionality but also allowed the retreival of data in the case that something was 'accidentally permanently deleted'.
