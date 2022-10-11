# 4me UI Mods
Tampermonkey script for use with the [4me](https://4me.com) enterprise service management system.

## Overview
We created the script to add useful enhancements to the 4me UI even if they weren't implemented in the official application. This way we can a) demo feature requests to 4me and b) use those modifications ourselves.

Use this script at your own risk. Merge requests and suggestions are always welcome.

## Usage
Install the [Tampermonkey](https://www.tampermonkey.net/) extension for your browser, add a new script and copy-paste the content of [ITRPuimods.user.js](https://github.com/apa-it/4me-UI-Mods/blob/master/ITRPuimods.user.js).

## Features

### Waiting-For
When your 4me inbox contains many entries it can be difficult to identify those you want to focus on next. Requests that are **Waiting for Customer** or **Waiting for...** a date usually are less urgent. Therefore we change their font color to grey so the other Records stick out better.

|Default Inbox|With mod enabled|
|---|---|
| ![](InboxDefault.PNG) | ![](InboxModded.PNG) |

### Hotkeys
Some UI buttons have been mapped to keys.

|Key|Action|
|---|---|
|e|Edit Record|
|g|Scroll to the bottom of the current Record|
|t|Scroll to the top of the current Record|
|Esc|Cancel Editing|

### Internal Comments
Internal comments are great for adding information to requests that should not be visible to customers - like technical details.

However, we sometimes have the issue that the analysis of an incident goes on for a few hours, specialists add only internal comments, and the customer cannot see that the Incident is actually being worked on.

The script changes the background of internal comments so it's more visible if it's been some time since the last customer-visible comment.

| Normal and internal comments without the mod | With mod enabled |
|---|---|
| ![](InternalCommentsDefault.PNG) | ![](InternalCommentsModded.PNG) |

### Resize Handles
Most people use large screens nowadays; 4me limits the reading area for notes to just over 500 pixels. 

This can be frustrating when people format long code or log lines with the Code Block element, and much horizontal scrolling is required.

The script adds resize handles to comments containing code blocks. This way they can be enlarged to simplify horizontal reading.

### Highlighting Records
Set the `highlightRecords` variable to change the color of record numbers in the inbox and record lists.
