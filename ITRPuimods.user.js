// ==UserScript==
// @name         ITRPuimods
// @version      0.17
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
          /* Add your custom styles here */
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
          cursor: pointer;
          color: #007BFF;
          text-decoration: underline;
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

  // Configuration settings for various features. Retrieved using GM_getValue.
  // Defaults are provided in case the settings are not defined yet.
  let config_DetailsAreaChanges = GM_getValue(
    "config_DetailsAreaChanges",
    true
  );

  let config_GrayOutWaitingRecords = GM_getValue(
    "config_GrayOutWaitingRecords",
    true
  );

  let config_BoldCurrentUserAssignments = GM_getValue(
    "config_BoldCurrentUserAssignments",
    true
  );

  let config_HighlightTopImpactIncidents = GM_getValue(
    "config_HighlightTopImpactIncidents",
    true
  );

  let config_ReduceWhitespaceInTables = GM_getValue(
    "config_ReduceWhitespaceInTables",
    true
  );

  let config_HighlightRecordIdentifiers = GM_getValue(
    "config_HighlightRecordIdentifiers",
    false
  );

  let config_GrayBackgroundForInternalComments = GM_getValue(
    "config_GrayBackgroundForInternalComments",
    true
  );

  let config_HideInternalComments = GM_getValue(
    "config_HideInternalComments",
    false
  );

  let config_ResizeHandlesForCodeBoxes = GM_getValue(
    "config_ResizeHandlesForCodeBoxes",
    true
  );

  let config_OpenLinksInSameTab = GM_getValue(
    "config_OpenLinksInSameTab",
    false
  );

  let config_Hotkeys = GM_getValue("config_Hotkeys", true);

  let config_SelfServiceEnhancements = GM_getValue(
    "config_SelfServiceEnhancements",
    true
  );

  // Create and show the GUI overlay
  function showGUI() {
    guiOverlay = document.createElement("div");
    guiOverlay.classList.add("gui-overlay");

    const content = document.createElement("div");
    content.classList.add("gui-content");

    content.innerHTML = `
            <h2>4me GUI MOD Settings:</h2>

            <div class="switch-container">
                <span>Details Area Changes: </span>
                <label class="switch">
                    <input type="checkbox" id="config_DetailsAreaChanges">
                    <span class="slider"></span>
                </label>
            </div>

            <div class="switch-container">
                <span>Gray Out Waiting Records:</span>
                <label class="switch">
                    <input type="checkbox" id="config_GrayOutWaitingRecords">
                    <span class="slider"></span>
                </label>
            </div>

            <div class="switch-container">
                <span>Bold Current User Assignments:</span>
                <label class="switch">
                    <input type="checkbox" id="config_BoldCurrentUserAssignments">
                    <span class="slider"></span>
                </label>
            </div>

            <div class="switch-container">
                <span>Highlight Top Impact Incidents:</span>
                <label class="switch">
                    <input type="checkbox" id="config_HighlightTopImpactIncidents">
                    <span class="slider"></span>
                </label>
            </div>

            <div class="switch-container">
                <span>Reduce Whitespace in Tables:</span>
                <label class="switch">
                    <input type="checkbox" id="config_ReduceWhitespaceInTables">
                    <span class="slider"></span>
                </label>
            </div>

            <div class="switch-container">
                <span>Highlight Record Identifiers:</span>
                <label class="switch">
                    <input type="checkbox" id="config_HighlightRecordIdentifiers">
                    <span class="slider"></span>
                </label>
            </div>

            <div class="switch-container">
                <span>Gray Background for Internal Comments:</span>
                <label class="switch">
                    <input type="checkbox" id="config_GrayBackgroundForInternalComments">
                    <span class="slider"></span>
                </label>
            </div>

            <div class="switch-container">
                <span>Hide Internal Comments:</span>
                <label class="switch">
                    <input type="checkbox" id="config_HideInternalComments">
                    <span class="slider"></span>
                </label>
            </div>

            <div class="switch-container">
                <span>Resize Handles for Code Boxes:</span>
                <label class="switch">
                    <input type="checkbox" id="config_ResizeHandlesForCodeBoxes">
                    <span class="slider"></span>
                </label>
            </div>

            <div class="switch-container">
                <span>Open Links in Same Tab:</span>
                <label class="switch">
                    <input type="checkbox" id="config_OpenLinksInSameTab">
                    <span class="slider"></span>
                </label>
            </div>

            <div class="switch-container">
                <span>Hotkeys:</span>
                <label class="switch">
                    <input type="checkbox" id="config_Hotkeys">
                    <span class="slider"></span>
                </label>
            </div>

            <div class="switch-container">
                <span>Self-Service Enhancements:</span>
                <label class="switch">
                    <input type="checkbox" id="config_SelfServiceEnhancements">
                    <span class="slider"></span>
                </label>
            </div>

            <div class="close-btn">Close</div>
            <div class="save-btn">Save</div>
        `;

    guiOverlay.appendChild(content);
    document.body.appendChild(guiOverlay);

    // Event listeners and actions for GUI elements related to configuration settings ( if true, then switch on => achieved with <Element>.checked )
    // Details Area Changes
    const detailsAreaChangesElement = document.getElementById(
      "config_DetailsAreaChanges"
    );
    detailsAreaChangesElement.checked = config_DetailsAreaChanges;
    detailsAreaChangesElement.addEventListener("change", function () {
      console.log("DetailsAreaChanges");
      GM_setValue("config_DetailsAreaChanges", !config_DetailsAreaChanges);
    });

    // Gray Out Waiting Records
    const grayOutWaitingRecordsElement = document.getElementById(
      "config_GrayOutWaitingRecords"
    );
    grayOutWaitingRecordsElement.checked = config_GrayOutWaitingRecords;
    grayOutWaitingRecordsElement.addEventListener("change", function () {
      console.log("GrayOutGrayOutWaitingRecordsWaitingRecords");
      GM_setValue(
        "config_GrayOutWaitingRecords",
        !config_GrayOutWaitingRecords
      );
    });

    // Bold Current User Assignments
    const boldCurrentUserAssignmentsElement = document.getElementById(
      "config_BoldCurrentUserAssignments"
    );
    boldCurrentUserAssignmentsElement.checked =
      config_BoldCurrentUserAssignments;
    boldCurrentUserAssignmentsElement.addEventListener("change", function () {
      console.log("BoldCurrentUserAssignments");
      GM_setValue(
        "config_BoldCurrentUserAssignments",
        !config_BoldCurrentUserAssignments
      );
    });

    // Highlight Top Impact Incidents
    const highlightTopImpactIncidentsElement = document.getElementById(
      "config_HighlightTopImpactIncidents"
    );
    highlightTopImpactIncidentsElement.checked =
      config_HighlightTopImpactIncidents;
    highlightTopImpactIncidentsElement.addEventListener("change", function () {
      console.log("highlightTopImpactIncidents");
      GM_setValue(
        "config_HighlightTopImpactIncidents",
        !config_HighlightTopImpactIncidents
      );
    });

    // Reduce Whitespace in Tables
    const reduceWhitespaceInTablesElement = document.getElementById(
      "config_ReduceWhitespaceInTables"
    );
    reduceWhitespaceInTablesElement.checked = config_ReduceWhitespaceInTables;
    reduceWhitespaceInTablesElement.addEventListener("change", function () {
      console.log("reduceWhitespaceInTables");
      GM_setValue(
        "config_ReduceWhitespaceInTables",
        !config_ReduceWhitespaceInTables
      );
    });

    // Highlight Record Identifiers
    const highlightRecordIdentifiersElement = document.getElementById(
      "config_HighlightRecordIdentifiers"
    );
    highlightRecordIdentifiersElement.checked =
      config_HighlightRecordIdentifiers;
    highlightRecordIdentifiersElement.addEventListener("change", function () {
      console.log("highlightrecordidentifiers");
      GM_setValue(
        "config_HighlightRecordIdentifiers",
        !config_HighlightRecordIdentifiers
      );
    });

    // Gray Background for Internal Comments
    const grayBackgroundForInternalCommentsElement = document.getElementById(
      "config_GrayBackgroundForInternalComments"
    );
    grayBackgroundForInternalCommentsElement.checked =
      config_GrayBackgroundForInternalComments;
    grayBackgroundForInternalCommentsElement.addEventListener(
      "change",
      function () {
        console.log("graybackgroundforinternalcomments");
        GM_setValue(
          "config_GrayBackgroundForInternalComments",
          !config_GrayBackgroundForInternalComments
        );
      }
    );

    // Gray Background for Internal Comments
    const hideInternalCommentsElement = document.getElementById(
      "config_HideInternalComments"
    );
    hideInternalCommentsElement.checked =
      config_HideInternalComments;
    hideInternalCommentsElement.addEventListener(
      "change",
      function () {
        console.log("hideinternalcomments");
        GM_setValue(
          "config_HideInternalComments",
          !config_HideInternalComments
        );
      }
    );

    // Resize Handles for Code Boxes
    const resizeHandlesForCodeBoxesElement = document.getElementById(
      "config_ResizeHandlesForCodeBoxes"
    );
    resizeHandlesForCodeBoxesElement.checked = config_ResizeHandlesForCodeBoxes;
    resizeHandlesForCodeBoxesElement.addEventListener("change", function () {
      console.log("resizehandlesforcodeboxeselement");
      GM_setValue(
        "config_ResizeHandlesForCodeBoxes",
        !config_ResizeHandlesForCodeBoxes
      );
    });

    // Open Links in Same Tab
    const openLinksInSameTabElement = document.getElementById(
      "config_OpenLinksInSameTab"
    );
    openLinksInSameTabElement.checked = config_OpenLinksInSameTab;
    openLinksInSameTabElement.addEventListener("change", function () {
      console.log("openLinksinSameTab");
      GM_setValue("config_OpenLinksInSameTab", !config_OpenLinksInSameTab);
    });

    // Hotkeys
    const hotkeysElement = document.getElementById("config_Hotkeys");
    hotkeysElement.checked = config_Hotkeys;
    hotkeysElement.addEventListener("change", function () {
      console.log("hotkeys");
      GM_setValue("config_Hotkeys", !config_Hotkeys);
    });

    // Self Service Enhancements
    const selfServiceEnhancements = document.getElementById(
      "config_SelfServiceEnhancements"
    );
    selfServiceEnhancements.checked = config_SelfServiceEnhancements;
    selfServiceEnhancements.addEventListener("change", function () {
      console.log("selfServiceEnhancements");
      GM_setValue(
        "config_SelfServiceEnhancements",
        !config_SelfServiceEnhancements
      );
    });

    // Event listeners for close and save buttons within the GUI overlay.
    const closeButton = content.querySelector(".close-btn");
    closeButton.addEventListener("click", function () {
      closeGUI();
    });

    const saveButton = content.querySelector(".save-btn");
    saveButton.addEventListener("click", function () {
      location.reload(true);
    });
  }

  // Function to close the GUI overlay
  function closeGUI() {
    if (guiOverlay) {
      guiOverlay.remove();
    }
  }

  // Register custom menu command to open GUI
  GM_registerMenuCommand("Open Settings", function () {
    showGUI();
  });

  // #######################################################################################
  const jQuery = window.jQuery; // Prevent warning by Tampermonkey editor.

  // Sometimes elements in the Detail Area only become visible after the DOM is loaded, e.g. when
  // the user clicks a Request in the Request list and the Request is shown in the detail view on the right.
  // All of the functions in this array will be called when the Details Area gets new content.
  let call_upon_details_change = [];

  // Upon changes in the Detail area, call every function in the call_upon_details_change array.
  if (config_DetailsAreaChanges) {
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

  if (config_BoldCurrentUserAssignments) {
    console.log("BoldCurrentUserAssignments-Feature enabled!");
    // Print lines bold where the current user is the assignee
    let currentUser = jQuery("div.avatar").attr("alt");
    jQuery("td.cell-assignment:contains('" + currentUser + "')")
      .closest("tr")
      .find("td")
      .css("font-weight", "bold");
  }

  // Highlight lines containing Top impact incidents
  if (config_HighlightTopImpactIncidents) {
    console.log("HighlightTopImpactIncidents-Feature enabled!");
    jQuery("div.grid-row")
      .has("div.icon-impact-top")
      .css({ color: "red", "background-color": "rgba(255,0,0, 0.08" });
  }

  // The new 4me UI has lots of whitespace in tables. Reduce this by 30%
  if (config_ReduceWhitespaceInTables) {
    console.log("ReduceWhitespaceInTables-Feature enabled!");
    jQuery(".grid-container").css("--cell-height", "25px");
  }

  // Highlight all Record Identifiers contained in a list.
  // TODO Currently we don't differentiate problems, requests and tasks here. Fix this.
  if (config_HighlightRecordIdentifiers) {
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
  if (config_GrayBackgroundForInternalComments) {
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


  if (config_HideInternalComments) {
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
  if (config_ResizeHandlesForCodeBoxes) {
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
  if (config_OpenLinksInSameTab) {
    console.log("OpenLinksInSameTab-Feature enabled!");

    function RemoveTargetBlank() {
      jQuery('a[target="_blank"]').removeAttr("target");
    }

    call_upon_details_change.push(RemoveTargetBlank);
    // Once upon load.
    RemoveTargetBlank();
  }

  if (config_Hotkeys) {
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
  if (config_SelfServiceEnhancements) {
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

  if (config_GrayOutWaitingRecords) {
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
