// ==UserScript==
// @name         ITRPuimods
// @version      0.19
// @description  Tampermonkey script. Modifications for the 4me/ITRP user interface. Works in Firefox and Chrome. Use at your own risk.
// @author       Thomas Volpini
//
// @updateURL    https://github.com/apa-it/4me-UI-Mods/raw/master/ITRPuimods.user.js
// @downloadURL  https://github.com/apa-it/4me-UI-Mods/raw/master/ITRPuimods.user.js
//
// @match   https://*.itrp.at/*
// @match   https://*.itrp.at/*
//
// @match   https://*.itrp-qa.at/*
// @match   https://*.itrp-qa.at/*
//
// @match   https://*.itrp.com/*
// @match   https://*.itrp.com/*
//
// @match   https://*.4me.com/*
// @match   https://*.4me.com/*
//
// @match   https://*.4me-demo.com/*
// @match   https://*.4me-demo.com/*
//
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
//
// @require https://code.jquery.com/jquery-3.6.4.min.js
//
// ==/UserScript==

(function () {
  "use strict";

  let guiOverlay;

  // Add custom CSS styles for the GUI overlay
  GM_addStyle(`
    .gui-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .gui-content {
        background-color: #fff;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    }
    .close-btn, .save-btn {
        cursor: pointer;
        color: #007BFF;
        text-decoration: underline;
        vertical-align: middle; /* Align buttons vertically */
        display: inline-block; /* Set display to inline-block */
    }
    .save-btn {
        float: right; /* Keep the Save button on the right */
    }
    /* Styles for the switches */
    .switch-container {
        display: grid;
        grid-template-columns: 1fr auto; /* Adjust the width of the switches */
        align-items: center;
        gap: 10px; /* Adjust the gap between switches */
        margin-bottom: 10px;
    }
    .switch {
        display: flex;
        align-items: center;
    }
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    .slider {
        width: 40px; /* Adjust the width of the switches */
        height: 20px; /* Adjust the height as needed */
        border-radius: 20px; /* Adjust the radius to make it half of the height */
        background-color: #ccc;
        position: relative;
        transition: background-color 0.4s;
    }
    .slider:before {
        content: '';
        position: absolute;
        left: 2px;
        top: 2px;
        width: 16px; /* Adjust the width to make it slightly smaller than the switch */
        height: 16px; /* Adjust the height to make it slightly smaller than the switch */
        border-radius: 50%;
        background-color: #fff;
        transition: transform 0.4s;
    }
    input:checked + .slider {
        background-color: #007BFF;
    }
    input:checked + .slider:before {
        transform: translateX(20px); /* Adjust the translation to align the circle properly */
    }
  `);

  // Configuration settings for various features
  const configuration = {
    config_DetailsAreaChanges: GM_getValue("config_DetailsAreaChanges", true),

    config_GrayOutWaitingRecords: GM_getValue("config_GrayOutWaitingRecords", true),

    // Currently broken
    // config_BoldCurrentUserAssignments: GM_getValue("config_BoldCurrentUserAssignments", true),

    // Currently broken
    // config_HighlightTopImpactIncidents: GM_getValue("config_HighlightTopImpactIncidents", true),

    config_ReduceWhitespaceInTables: GM_getValue("config_ReduceWhitespaceInTables", true),

    // Not so useful
    // config_HighlightRecordIdentifiers: GM_getValue("config_HighlightRecordIdentifiers", false),

    config_GrayBackgroundForInternalComments: GM_getValue("config_GrayBackgroundForInternalComments", true),
    config_HideInternalComments: GM_getValue("config_HideInternalComments", false),
    config_ResizeHandlesForCodeBoxes: GM_getValue("config_ResizeHandlesForCodeBoxes", true),
    config_OpenLinksInSameTab: GM_getValue("config_OpenLinksInSameTab", false),
    config_Hotkeys: GM_getValue("config_Hotkeys", true),
    config_SelfServiceEnhancements: GM_getValue("config_SelfServiceEnhancements", true),
  };

  // Create and show the GUI overlay
  function showGUI() {
    guiOverlay = document.createElement("div");
    guiOverlay.classList.add("gui-overlay");

    const content = document.createElement("div");
    content.classList.add("gui-content");

    content.innerHTML = `
      <h2>4me GUI Mod Settings</h2>
      ${Object.keys(configuration).map(configKey => `
        <div class="switch-container">
          <span>${configKey.replace(/^config_/, '')}</span>
          <label class="switch">
            <input type="checkbox" id="${configKey}">
            <span class="slider"></span>
          </label>
        </div>
      `).join('')}
      <div class="close-btn">Close</div>
      <div class="save-btn">Save</div>
    `;

    guiOverlay.appendChild(content);
    document.body.appendChild(guiOverlay);

    // Initialize the checkboxes based on the current configuration
    Object.keys(configuration).forEach(configKey => {
      const element = document.getElementById(configKey);
      element.checked = configuration[configKey];
      element.addEventListener("change", () => {
        configuration[configKey] = !configuration[configKey];
        GM_setValue(configKey, configuration[configKey]);
        console.log("Changed " + configKey + " " + configuration[configKey])
      });
    });

    // Event listeners for close and save buttons within the GUI overlay.
    content.querySelector(".close-btn").addEventListener("click", closeGUI);
    content.querySelector(".save-btn").addEventListener("click", () => location.reload(true));
  }

  // Function to close the GUI overlay
  function closeGUI() {
    if (guiOverlay) {
      guiOverlay.remove();
    }
  }

  // Register custom menu command to open GUI
  GM_registerMenuCommand("Open Settings", showGUI);

  // #######################################################################################
  const jQuery = window.jQuery; // Prevent warning by Tampermonkey editor.

  // Sometimes elements in the Detail Area only become visible after the DOM is loaded, e.g. when
  // the user clicks a Request in the Request list and the Request is shown in the detail view on the right.
  // All of the functions in this array will be called when the Details Area gets new content.
  let call_upon_details_change = [];

  // Upon changes in the Detail area, call every function in the call_upon_details_change array.
  if (configuration.config_DetailsAreaChanges) {
    console.log("DetailsAreaChanges-Feature enabled!");
    // Handle changes in details area
    const targetNode = document.getElementById("details_area");

    if (targetNode) {
        // Options for the observer (which mutations to observe)
        const config = { attributes: false, childList: true, subtree: true };

        // Callback function to execute when mutations are observed
        const callback = (mutationList, observer) => {
            for (let i = 0; i < call_upon_details_change.length; i++) {
                call_upon_details_change[i]();
            }
        };

        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(callback);

        // Start observing the target node for configured mutations
        observer.observe(targetNode, config);
    }
  }

  if (configuration.config_BoldCurrentUserAssignments) {
    // Currently broken.
    console.log("BoldCurrentUserAssignments-Feature enabled!");
    // Print lines bold where the current user is the assignee
    let currentUser = jQuery("img.avatar").attr("alt");
    jQuery("td.cell-assignment:contains('" + currentUser + "')")
      .closest("tr")
      .find("td")
      .css("font-weight", "bold");
  }

  // Highlight lines containing Top impact incidents
  if (configuration.config_HighlightTopImpactIncidents) {
    // Currently broken
    console.log("HighlightTopImpactIncidents-Feature enabled!");
    jQuery("div.grid-row")
      .has("div.icon-impact-top")
      .css({ color: "red", "background-color": "rgba(255,0,0, 0.08" });
  }

  // The new 4me UI has lots of whitespace in tables. Reduce this by 30%
  if (configuration.config_ReduceWhitespaceInTables) {
    console.log("ReduceWhitespaceInTables-Feature enabled!");
    jQuery(".grid-container").css("--cell-height", "25px");
  }

  // Highlight all Record Identifiers contained in a list.
  // TODO Currently we don't differentiate problems, requests and tasks here. Fix this.
  if (configuration.config_HighlightRecordIdentifiers) {
    console.log("HighlightRecordIdentifiers-Feature enabled!");

    let highlightRecords = [1159, 1193, 173002, 179426];
    jQuery("span.record-identifier")
      .filter(function () {
        return highlightRecords.includes(parseInt(jQuery(this).text()));
      })
      .css("color", "green");
  }

  // Gray background for internal comments.
  // This makes it easier to see if a record didn't get a customer-visible comment for some time.
  if (configuration.config_GrayBackgroundForInternalComments) {
    console.log("GrayBackgroundForInternalComments-Feature enabled!");

    function FormatInternalComments() {
      // Adding and checking apaIt_InternalComment is to prevent loops.
      jQuery("div.icon-locked")
        .closest("li")
        .find("div.note-content")
        .not(".apaIt_InternalComment")
        .addClass("apaIt_InternalComment")
        .css({
          "background-color": "LightGray",
          color: "black",
          "border-bottom-left-radius": "5px",
          "border-bottom-right-radius": "5px",
          "border-top-left-radius": "5px",
          "border-top-right-radius": "5px",
        });
    }

    call_upon_details_change.push(FormatInternalComments);

    // Once upon load.
    // This call is for internal comments that are immediately visible after the DOM is loaded.
    FormatInternalComments();
  }


  if (configuration.config_HideInternalComments) {
    console.log("HideinternalComments-Feature enabled!");

    function HideInternalComments() {
      jQuery("div.icon-locked")
        .closest("li")
        .text("(Internal note)")
    }

    call_upon_details_change.push(HideInternalComments);

    // Once upon load.
    // This call is for internal comments that are immediately visible after the DOM is loaded.
    HideInternalComments();
  }


  // Add resize handles to code boxes
  if (configuration.config_ResizeHandlesForCodeBoxes) {
    console.log("ResizeHandlesForCodeBoxes-Feature enabled!");

    function AddCodeResizeHandles() {
      jQuery("code")
        .closest("div")
        .css("overflow", "auto")
        .css("resize", "both");
    }

    call_upon_details_change.push(AddCodeResizeHandles);

    // Once upon load.
    AddCodeResizeHandles();
  }

  // Open links in same tab instead of new one.
  if (configuration.config_OpenLinksInSameTab) {
    console.log("OpenLinksInSameTab-Feature enabled!");

    function RemoveTargetBlank() {
      jQuery('a[target="_blank"]').removeAttr("target");
    }

    call_upon_details_change.push(RemoveTargetBlank);
    // Once upon load.
    RemoveTargetBlank();
  }

  if (configuration.config_Hotkeys) {
      console.log("Hotkeys-Feature enabled!");

      function inputFocused() {
          if (
              jQuery(document.activeElement).is("input") ||
              jQuery(document.activeElement).hasClass("public-DraftEditor-content") ||
              jQuery(document.activeElement).hasClass("ProseMirror") ||
              jQuery(document.activeElement).is(".suggest, .txt") ||
              jQuery(document.activeElement).is("select")
          ) {
              // console.log("activeEle");
              return true;
          } else {
              // console.log("no activeele");
              return false;
          }
      }

      // When the 'e' key is pressed, click the 'Edit' button.
      jQuery(document).keydown(function(event) {
          // Don't do anything if the user is typing in an input element.
          if (inputFocused()) {
              return;
          }

          if (event.key === "e") {
              if (jQuery(".modal_panel").length > 0) return; // Don't click the edit button when modal panels are visible.
              jQuery("span.icon-edit").click();
          }

          // When the 'g' key is pressed, click the 'Down' button to scroll to the bottom of the Request.
          else if (event.key === "g") {
              jQuery("i.scroll-button-down").click();
          }

          // When the 't' key is pressed, click the 'Up' button to scroll to the top of the Request.
          else if (event.key === "t") {
              jQuery("i.scroll-button-up").click();
          }
      });


      // When the Escape key is pressed, cancel editing.
      jQuery(document).keyup(function (event) {
          if (event.keyCode === 27) {
              // Escape
              if (jQuery("#active_save_changes_confirm").length) {
                  // Is the 'your changes will be lost' popup visible?
                  jQuery("#active_save_changes_confirm")
                      .find("#save_changes_cancel")
                      .click(); // Click the 'cancel' button in the 'your changes will be lost' popup.
              } else {
                  jQuery("div.btn.cancel").click(); // Cancel editing.
              }
          }
      });
  }

  // Self Service
  if (configuration.config_SelfServiceEnhancements) {
    console.log("SelfServiceEnhancements-Feature enabled!");

    // Opening multiple Requests is currently difficult in Self Service because Requests
    // cannot be Ctrl-clicked to open them in a new tab. This fixes the issue by adding Ctrl-clickable links.
    jQuery("li.list-item[id*='request_']").each(function () {
      jQuery(this)
        .find("div.lane-actions")
        .append(
          '<br><a href="' +
            jQuery(this).attr("href") +
            '">Ctrl-clickable Link</a>'
        );
    });

    // Have a second save button at the bottom. Useful for Requests with more than three Notes.
    let saveButton = jQuery("button#save");
    let newSaveButton = saveButton.clone().appendTo("form.edit_req");
    newSaveButton.click(function () {
      saveButton.click();
    });
  }

  if (configuration.config_GrayOutWaitingRecords) {
    console.log("GrayOutWaitingRecords-Feature enabled!");

    // Gray-out lines containing "Waiting..." Records.
    jQuery("div.grid-row")
      .has("div.cell-status")
      .filter(function () {
        let reg_w =
          /Waiting|Warten|Wachtend|En Attente|Esperando|Aguardando|Aspettando/;
        let reg_wfy = /Waiting for You/;
        return (
          reg_w.test(jQuery(this).text()) && !reg_wfy.test(jQuery(this).text())
        );
      })
      .css("color", "Gainsboro");
  }
})();
