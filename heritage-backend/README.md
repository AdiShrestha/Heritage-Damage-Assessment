# Heritage Damage Assessment API

This is the backend FastAPI application for the Heritage Damage Assessment system.

## Available Models
- `moe` (default): Mixture of Experts ensemble combining ResNet, EfficientNet, ViT, and YOLO features.
- `resnet50`: ResNet-50 trained with EMA (Exponential Moving Average).
- `efficientnet_b4`: EfficientNet-B4 taking 380x380 high-res inputs.
- `vgg16`: VGG-16 classic CNN architecture.
- `vit_b16`: Vision Transformer base model (patch size 16).
- `yolo_damage`: YOLO model for damage assessment.
- `mock`: Placeholder model for testing.
