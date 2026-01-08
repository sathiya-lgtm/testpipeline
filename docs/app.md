# Insites UI

## Overview

Documentation detailing aspects of the Portal UI such as installing, testing, debugging, and the code base.

## How to run locally

1.  Clone down the repo `git clone https://github.com/jemez-technology/tng-portal-api.git`
2.  Make sure node is installed on your machine (version 22.14.0 as of time of writting 4/14/2025)
3.  Inside the app directory, add a .env file based on the structure found in the .env.example.
    There are two variables that can be used to point locally, at dev, at QA, or even at prod. The values for each of these
    is found in the .env.example file. It's easiest to point at dev if you are just getting started.
4.  Run `npm install` inside the app directory to install all dependencies.
5.  Run `npm start` to start the app in development mode. The app can be found running on `http://localhost:3000`.

## How to run the api locally

1.  Clone down the api repo `git clone https://github.com/jemez-technology/tng-portal-api.git`
2.  Follow these instructions to run the api locally
    [instructions](https://github.com/jemez-technology/tng-portal-api/tree/main/documentation)
3.  Point the insites UI to the local environment by updating the .env file. Change the value for VITE_API_DOMAIN to `http://localhost:8000`

## How user sessions are managed

Below is a high level explanation of how user sessions are being managed on the UI.

### Session management cycle

Note: Session duration is defined entirely on the back-end. The UI only determines how often and under what circumstances
the session is refreshed.

Note: The browser's `sessionStorage` is used to store user's session token. Session storage is automatically cleared when the user closes browser or tab thus ending their session. `sessionStorage` also allows for different sessions across different tabs.

Key terms / concepts used in session management logic on the UI:

- "_Activity window_": duration of time that user's activity is valid. User activity is invalidated every 60 seconds. Provides
  a way for the app to distinguish between recent and non recent activity.

- "_Refresh threshold_": Time remaining in user session before application will bother refreshing session. This enables the app to
  only refresh sessions when needed instead of doing so immediately upon user activity.

- "_Warning threshold_": Time remaining in user session before application considers the session "close enough" to expiring that it should
  prompt the user to manually refresh token or logout (via modal).

- "_Warning countdown buffer_": Amount of time added to "warning threshold" such that the warning is triggered early enough
  to account for the amount of time it could take (worst case) for the refresh HTTP request to process. Once the "warning threshold" is surpassed, a session countdown modal will appear and begin counting down from <= 60 seconds, however the actual time remaining in the session is <= 60 seconds + "warning countdown buffer" thus providing enough time for the API to return a refresh token before the session expires in the worst case in which the user clicked "Stay logged in" at the last second and the API almost times out before returning new token.

When user logs in:

1. UI saves JWT to global store (React context) and `sessionStorage`.
2. A click event listener is added to entire `window`.
3. A click event will toggle `hasUserBeenActiveRef` reference variable to `true` whenever user clicks on `window`.
4. An interval is started for executing `resetHasUserBeenActive` function that will reset the `hasUserBeenActiveRef` to `false` every 60 seconds.
5. A separate interval: `checkSessionStatusInterval` is started, that checks to see if the `hasUserBeenActiveRef` is `true` every second.
6. Each check of the session status via `checkSessionStatusInterval` performs a check to see if the session is close to expiring, in which case the user has to manually refresh their session, or if the UI should automatically refresh the user's session.
7. If the session is close to expiring (i.e. has surpassed the "warning threshold"), the UI will display a modal, prompting users to either refresh their session or log out.
   8 If the session is not close to expiring, the UI will determine whether or not the token should be refreshed,
8. Determining whether or not the app should refresh the token comes in the form of the `shouldRefreshToken` function. The function
   will return `true` if the remaining time of the user session is close enough to expiring as to prompt a refresh (i.e. has surpassed the "refresh threshold") and if the user has been active within the last "activity window".
