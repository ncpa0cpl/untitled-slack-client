import envs from "gapp:env";
import Gtk from "gi://Gtk";
import React from "react";
import {
  Box,
  Button,
  HeaderBar,
  Icon,
  PackEnd,
  PopoverMenu,
  PopoverMenuEntry,
  PopoverMenuRadioButton,
} from "react-gjs-renderer";
import type { SyntheticEvent } from "react-gjs-renderer/dist/gjs-elements/rg-types";
import { FontSettings } from "../../quarks/settings/font-size";

const BtnImage = Gtk.Image.new_from_icon_name(
  Icon.ViewMore + "-symbolic",
  Gtk.IconSize.LARGE_TOOLBAR
);

export const WindowBar = () => {
  const fontSettings = FontSettings.use();

  const msgFontSizeChangeHandler = React.useCallback(
    (
      e: SyntheticEvent<
        { isActive: boolean },
        Rg.Element.PopoverMenuRadioButtonElement
      >
    ) => {
      if (e.isActive) {
        switch (e.targetWidget.text) {
          case "10px":
            fontSettings.setMsgSize(10);
            break;
          case "12px":
            fontSettings.setMsgSize(12);
            break;
          case "14px":
            fontSettings.setMsgSize(14);
            break;
          case "16px":
            fontSettings.setMsgSize(16);
            break;
          case "18px":
            fontSettings.setMsgSize(18);
            break;
          case "20px":
            fontSettings.setMsgSize(20);
            break;
        }
      }
    },
    []
  );

  const uiFontSizeChangeHandler = React.useCallback(
    (
      e: SyntheticEvent<
        { isActive: boolean },
        Rg.Element.PopoverMenuRadioButtonElement
      >
    ) => {
      if (e.isActive) {
        switch (e.targetWidget.text) {
          case "10px":
            fontSettings.setUiSize(10);
            break;
          case "12px":
            fontSettings.setUiSize(12);
            break;
          case "14px":
            fontSettings.setUiSize(14);
            break;
          case "16px":
            fontSettings.setUiSize(16);
            break;
          case "18px":
            fontSettings.setUiSize(18);
            break;
          case "20px":
            fontSettings.setUiSize(20);
            break;
        }
      }
    },
    []
  );

  return (
    <HeaderBar showControlButtons title={envs.friendlyAppName}>
      {fontSettings.value.firsLoadCompleted && (
        <PackEnd element={Box}>
          <PopoverMenu
            renderPopover={() => (
              <>
                <PopoverMenuEntry
                  label="Messages Font Size"
                  submenuBackButtonLabel="Back"
                >
                  <PopoverMenuRadioButton
                    radioGroup="msg-font-size"
                    label="10px"
                    isDefault={fontSettings.value.msgSize === 10}
                    onChange={msgFontSizeChangeHandler}
                  />
                  <PopoverMenuRadioButton
                    radioGroup="msg-font-size"
                    label="12px"
                    isDefault={fontSettings.value.msgSize === 12}
                    onChange={msgFontSizeChangeHandler}
                  />
                  <PopoverMenuRadioButton
                    radioGroup="msg-font-size"
                    label="14px"
                    isDefault={fontSettings.value.msgSize === 14}
                    onChange={msgFontSizeChangeHandler}
                  />
                  <PopoverMenuRadioButton
                    radioGroup="msg-font-size"
                    label="16px"
                    isDefault={fontSettings.value.msgSize === 16}
                    onChange={msgFontSizeChangeHandler}
                  />
                  <PopoverMenuRadioButton
                    radioGroup="msg-font-size"
                    label="18px"
                    isDefault={fontSettings.value.msgSize === 18}
                    onChange={msgFontSizeChangeHandler}
                  />
                  <PopoverMenuRadioButton
                    radioGroup="msg-font-size"
                    label="20px"
                    isDefault={fontSettings.value.msgSize === 20}
                    onChange={msgFontSizeChangeHandler}
                  />
                </PopoverMenuEntry>
                <PopoverMenuEntry
                  label="UI Font Size"
                  submenuBackButtonLabel="Back"
                >
                  <PopoverMenuRadioButton
                    radioGroup="ui-font-size"
                    label="10px"
                    isDefault={fontSettings.value.uiSize === 10}
                    onChange={uiFontSizeChangeHandler}
                  />
                  <PopoverMenuRadioButton
                    radioGroup="ui-font-size"
                    label="12px"
                    isDefault={fontSettings.value.uiSize === 12}
                    onChange={uiFontSizeChangeHandler}
                  />
                  <PopoverMenuRadioButton
                    radioGroup="ui-font-size"
                    label="14px"
                    isDefault={fontSettings.value.uiSize === 14}
                    onChange={uiFontSizeChangeHandler}
                  />
                  <PopoverMenuRadioButton
                    radioGroup="ui-font-size"
                    label="16px"
                    isDefault={fontSettings.value.uiSize === 16}
                    onChange={uiFontSizeChangeHandler}
                  />
                  <PopoverMenuRadioButton
                    radioGroup="ui-font-size"
                    label="18px"
                    isDefault={fontSettings.value.uiSize === 18}
                    onChange={uiFontSizeChangeHandler}
                  />
                  <PopoverMenuRadioButton
                    radioGroup="ui-font-size"
                    label="20px"
                    isDefault={fontSettings.value.uiSize === 20}
                    onChange={uiFontSizeChangeHandler}
                  />
                </PopoverMenuEntry>
              </>
            )}
            renderAnchor={(open) => (
              <Button margin={[0, 10, 0, 0]} image={BtnImage} onClick={open} />
            )}
          />
        </PackEnd>
      )}
    </HeaderBar>
  );
};
