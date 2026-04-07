"""Shared drawing utilities for OpenCV visualization."""

import cv2


def draw_text_outline(img, text, pos, text_color=(0, 255, 0), bg_color=(0, 0, 0)):
    """Draw text with outline for better visibility.
    
    Args:
        img: OpenCV image to draw on
        text: Text to display
        pos: Tuple (x, y) position for text
        text_color: RGB tuple for text color (default: green)
        bg_color: RGB tuple for outline/background color (default: black)
    """
    font = cv2.FONT_HERSHEY_DUPLEX
    font_scale = 0.6
    thickness = 1
    x, y = pos
    
    # Draw background outline for contrast
    cv2.putText(img, text, (x, y), font, font_scale, bg_color, thickness + 2, cv2.LINE_AA)
    # Draw text on top
    cv2.putText(img, text, (x, y), font, font_scale, text_color, thickness, cv2.LINE_AA)
