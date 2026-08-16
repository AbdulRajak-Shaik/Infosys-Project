"""Image preprocessing utilities for soil image classification."""

from pathlib import Path
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError


def preprocess_image(image_path: str) -> np.ndarray:
    """Load an image, resize it, normalize it, and return a model-ready array.

    The returned array has the shape (1, 224, 224, 3), which is suitable for
    TensorFlow image classification models that expect a batch of images.

    Args:
        image_path: File path to the input image.

    Returns:
        A NumPy array of shape (1, 224, 224, 3) with pixel values in [0, 255].
    """
    if not image_path or not str(image_path).strip():
        raise ValueError("image_path must be a non-empty string.")

    image_file = Path(image_path)
    if not image_file.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    try:
        with Image.open(image_file) as img:
            # Auto-rotate image according to EXIF orientation metadata
            img = ImageOps.exif_transpose(img)
            rgb_image = img.convert("RGB")
            # Resize using PIL Bilinear interpolation (matching Keras load_img target_size)
            resized_img = rgb_image.resize((224, 224), Image.Resampling.BILINEAR)
            img_array = np.array(resized_img, dtype=np.float32)
            processed_image = np.expand_dims(img_array, axis=0)
            return processed_image
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError(f"Unable to read image from path: {image_path}") from exc
