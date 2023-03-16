# Botpress Connector
This app will allow you to connect your botpress bot with your Rocket.Chat server.

## Do you need a bot?
You can reach us [Open](https://open.rocket.chat/channel/bots), and find professional help for that.

## Installation
Clone this repository and using the rc-apps cli deploy it:
```bash
rc-apps deploy --url https://YOURDOMAIN -u USER -p PWD
````
Or
Use download the latest release and install it manually on your Rocket.Chat server

## Configuration

First go ahead and create a Bot User. Login as administrator, then go to ```Setting > Users```. There create a new Bot User. This new user should have these 2 roles.

* bot
* livechat-agent

Then configure the app to automatically assign a livechat-visitor to this bot. To do so, goto ```Setting > Omnichannel > Routing```. There enable ```Assign new conversations to bot agent``` Setting.

The app needs some configurations to work, so to setup the app Go to ```Setting > Apps > Botpress Connector```. There, fill all the necessary fields in ```SETTINGS``` and click ```SAVE```. Note all fields are required.

Some of the fields in ```SETTING``` include

* Rocket.Chat bot username (required) - This should contain the same bot username which we created above in Step 1
* Botpress bot id (required) - This should contain the botpress id from your botpress server
* Botpress server URL. Eg:- http://localhost:5005
* Service Unavailable Message (optional) - The Bot will send this message to Visitor if service is unavailable like suppose if no agents are online.
* Close Chat Message (optional) - This message will be sent automatically when a chat is closed
* Handover Message (optional) - The Bot will send this message to Visitor upon handover
* Default Handover Department Name (required) - Enter the target department name where you want to transfer the visitor upon handover. Note that you can override setting using * * Handover action.
* Hide Quick Replies (required) - If enabled, then all quick-replies will hide when a visitor clicks on any one of them

## Contributing
Pull requests are welcome, please make this code better! You can reach me on [Open](https://open.rocket.chat/direct/hlatki)

## License
[MIT](https://choosealicense.com/licenses/mit/)
Thanks Luis Hlatki for putting this app together :)
