import React from "react";
import { StyleSheet } from "react-native";
import { angularize } from "../angular-react-helper";
import { Button } from 'react-native-paper';
import { string } from "prop-types";

const DiaryButton = ({ text, fillColor, ...buttonProps }) => {
  return (
    <Button mode="elevated"
      buttonColor={fillColor || "white"}
      style={fillColor ? buttonStyles.fillButton : buttonStyles.outlineButton}
      labelStyle={fillColor ? {color: 'white', ...buttonStyles.label} : buttonStyles.label}
      contentStyle={buttonStyles.buttonContent}
      {...buttonProps}>
      {text}
    </Button>
  );
};
DiaryButton.propTypes = {
  text: string
}

const buttonStyles = StyleSheet.create({
  outlineButton: {
    borderColor: '#0088ce',
    borderWidth: 1.5,
  },
  fillButton: {
    color: '#FFFFFF',
  },
  buttonContent: {
    height: 25,
  },
  label: {
    marginHorizontal: 0,
    fontSize: 13,
    fontWeight: 500,
  }
});

angularize(DiaryButton, 'emission.main.diary.button');
export default DiaryButton;

// diaryButton: {
//   flex: 1,
//   paddingHorizontal: 14,
//   paddingVertical: 5,
//   alignItems: 'center',
//   justifyContent: 'center',
//   minWidth: 100,
//   maxHeight: 40,
//   margin: 2,
//   borderRadius: 50,
//   fontSize: 12,
//   fontWeight: 500,
//   elevation: 1,
//   shadowColor: '#171717',
//   shadowOffset: { width: -2, height: 4 },
//   shadowOpacity: 0.2,
//   shadowRadius: 3,
//   backgroundColor: 'white',
//   border: '1px solid #171717',
// },
