"""Image preprocessing utilities for soil image classification."""

from pathlib import Path

import numpy as np
try:
    import tensorflow as tf
    from tensorflow.keras.applications.efficientnet import preprocess_input
except ImportError:
    tf = None
    preprocess_input = None

from PIL import Image, UnidentifiedImageError


def preprocess_image(image_path: str) -> np.ndarray:
    """Load an image, resize it, normalize it, and return a model-ready array.

    The returned array has the shape (1, 224, 224, 3), which is suitable for
    TensorFlow image classification models that expect a batch of images.

    Args:
        image_path: File path to the input image.

    Returns:
        A NumPy array of shape (1, 224, 224, 3) with pixel values normalized
        to the range [0, 1].

    Raises:
        ValueError: If the image path is empty or the image cannot be processed.
        FileNotFoundError: If the image file does not exist.
    """
    if not image_path or not str(image_path).strip():
        raise ValueError("image_path must be a non-empty string.")

    image_file = Path(image_path)
    if not image_file.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    try:
        with Image.open(image_file) as image:
            rgb_image = image.convert("RGB")
            resized_pil = rgb_image.resize((224, 224), Image.Resampling.BILINEAR if hasattr(Image, "Resampling") else Image.BILINEAR)
            image_array = np.array(resized_pil, dtype=np.float32)
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError(f"Unable to read image from path: {image_path}") from exc

    if image_array.ndim != 3:
        raise ValueError("The loaded image must have three dimensions: height, width, channels.")

    if tf is not None and preprocess_input is not None:
        try:
            preprocessed_image = preprocess_input(image_array)
            return np.expand_dims(preprocessed_image, axis=0)
        except Exception:
            pass

    # Standard normalization fallback
    normalized = image_array / 255.0
    return np.expand_dims(normalized, axis=0)
