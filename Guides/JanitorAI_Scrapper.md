# Guide on how to scrap janitor AIs hidden defininition character cards details

## 1. Setting up server.

1. First of all download these two files and keep them in a folder together: [server.js](../Scripts/JanitorAI/server.js) and [package.json](../Scripts/JanitorAI/package.json) like this: [image](../Images/janitor-scrapper.png) 
2. Then:
    - If you are on windows, right click an empty space and open terminal in the folder.
    - If you are on linux/mac, open terminal to that folder.
3. Run `npm i` in the terminal. "This is one time step only."
4. Then, run `node server.js`. It will start the node js server.

## 2. Setting up cloudflare.

1. Setup cloudflare try on your system. [link](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/)
2. Run this command by opening other terminal window.
    `cloudflared tunnel --url http://localhost:3000`
3. Wait for few seconds and you will get a url something like this.

    ![image](../Images/trycloudflare.png)
4. Copy the url that is ending with "trycloudflare.com".

## 3. Setup in Janitor AI

1. Open [Janitor AI](https://janitorai.com/)

> [!WARNING]
> It only works for the character cards that are proxy enabled.

2. Go to your desired proxy enabled card and start chat.
3. Click on the upper right corner where it is written "Using Janitor" or "Using ...".
4. Select "proxy" among the options.
5. Select custom in model and keep other settings like this.

    ![image](../Images/janitor-proxy.png)
6. In the url box, paste the trycloudflare url that you copied before and add this in the end `/v1/chat/completions`
7. Add `mock-model-1` in model name and `custom-key` in API key field box.
8. Scroll down and click on save settings.
9. Refresh the chat page
10. Now send any message like "hi".

## 4. Final Steps:

1. After sending, come to your terminal where the node js server is running.
2. You will see something like this:

    ![image](../Images/janitor-output.png)
3. You will also find a file name "requests.log" in the folder where server.js file is.
4. You will find two XML tags wrapped section, one with your persona name and another with character card name.
5. The details between the tags like in my case `<Seirra>` and `</Seirra>` is the information of the character card.
6. Just copy the details either from the "requests.log" file or from the terminal output and paste it inside SillyTavern.
7. Close both the terminal after you are done.

**Voila! This way you can copy any proxy enabled character card from janitor ai. Have Fun! 😉**
