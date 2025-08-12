import * as React from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../app/theme';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteText?: string;
  confirmTitle?: string;
  confirmMessage?: string;
  swipeThreshold?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const DELETE_BUTTON_WIDTH = 80;

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  deleteText = 'Delete',
  confirmTitle = 'Confirm Delete',
  confirmMessage = 'Are you sure you want to delete this item?',
  swipeThreshold = screenWidth * 0.25,
}) => {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = React.useState(false);

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipes (negative dx)
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -DELETE_BUTTON_WIDTH));
        } else if (isOpen) {
          // If already open, allow right swipe to close
          translateX.setValue(Math.min(gestureState.dx - DELETE_BUTTON_WIDTH, 0));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldOpen = gestureState.dx < -swipeThreshold / 3 || gestureState.vx < -0.5;
        const shouldClose = gestureState.dx > swipeThreshold / 3 || gestureState.vx > 0.5;

        if (!isOpen && shouldOpen) {
          // Open the delete button
          setIsOpen(true);
          Animated.spring(translateX, {
            toValue: -DELETE_BUTTON_WIDTH,
            useNativeDriver: false,
          }).start();
        } else if (isOpen && shouldClose) {
          // Close the delete button
          setIsOpen(false);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        } else {
          // Snap back to current state
          Animated.spring(translateX, {
            toValue: isOpen ? -DELETE_BUTTON_WIDTH : 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Alert.alert(
      confirmTitle,
      confirmMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: closeRow,
        },
        {
          text: deleteText,
          style: 'destructive',
          onPress: () => {
            onDelete();
            closeRow();
          },
        },
      ]
    );
  };

  const closeRow = () => {
    setIsOpen(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Delete button (behind the main content) */}
      <View style={styles.deleteButtonContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Icon name="delete" size={24} color={theme.colors.background} />
          <Text style={styles.deleteButtonText}>{deleteText}</Text>
        </TouchableOpacity>
      </View>

      {/* Main content (swipeable) */}
      <Animated.View
        style={[
          styles.mainContent,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  deleteButtonText: {
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  mainContent: {
    backgroundColor: theme.colors.background,
  },
});
