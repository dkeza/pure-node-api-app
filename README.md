# pure-node-api-app

How to generate cert and pem files in https folder:

openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem