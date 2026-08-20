The current Crop Recommendation screen is incomplete and does not match the backend implementation.

Do NOT redesign the entire application. Only redesign the Crop Recommendation page while maintaining the existing design system, navigation, colors, typography, spacing, sidebar, top navigation, and overall UI style.

The backend API requires both a soil image and numerical soil/climate parameters to generate crop recommendations. Therefore, the Crop Recommendation page must support multimodal AI prediction.

Goal

Redesign the Crop Recommendation page into a professional AI-powered workspace that accepts:

Soil Image Upload (Required)
Nitrogen (N)
Phosphorus (P)
Potassium (K)
Temperature
Humidity
Soil pH
Rainfall

The prediction should only run after both the image and all required values are provided.

Layout

Use a responsive two-column layout.

Left Panel (40%)
Crop Input

At the very top add a new card called

Upload Soil Image

This card should include:

Large drag-and-drop upload area
Upload icon
Soil illustration placeholder
"Drag & Drop Soil Image"
"or Browse Files"
Supported formats:
JPG
PNG
JPEG
Maximum size
Camera button (mobile)
Upload progress indicator

After upload show

Image preview
File name
Replace button
Remove button

Below the upload card place another card titled

Soil & Climate Parameters

Arrange inputs in a clean responsive two-column grid.

Fields

Nitrogen (N)

Phosphorus (P)

Potassium (K)

Temperature

Humidity

Soil pH

Rainfall

Each field should have

icon
helper text
placeholder
validation state

Below the form

Large Primary Button

Predict Best Crop

Secondary Button

Reset

Disable Predict until

Image uploaded
All fields completed

Show inline validation

"Upload a soil image"

or

"Complete required parameters"

Right Panel (60%)

Initially show an attractive empty AI state.

Large agriculture illustration

Title

Ready for AI Analysis

Subtitle

Upload a soil image and enter soil parameters to receive an AI-powered crop recommendation.

Below show three feature cards

AI Soil Analysis

Climate Matching

Smart Crop Recommendation

During Prediction

Replace empty state with AI loading animation.

Animated progress

Analyzing Soil Image...

Extracting Features...

Processing Soil Nutrients...

Comparing Crop Profiles...

Generating Recommendation...

Estimated time

3–5 seconds

Prediction Result

After prediction show multiple cards.

Card 1

Soil Analysis

Display

Uploaded image preview

Predicted Soil

Confidence %

Model Used

Prediction Time

Card 2

Recommended Crop

Large crop illustration

Crop Name

Confidence

Growing Season

Suitable Region

Expected Yield

Water Requirement

Harvest Time

Difficulty Level

Card 3

AI Explanation

Explain why this crop was recommended.

Example

"The uploaded soil image was classified as Black Soil with 98.2% confidence. Based on Nitrogen, Phosphorus, Potassium, pH, rainfall, temperature, and humidity, Rice provides the highest expected yield under current environmental conditions."

Card 4

Recommendations

Organic Fertilizer

Irrigation Advice

Planting Tips

Disease Prevention

Harvest Recommendation

Bottom Actions

Download PDF Report

Save Prediction

Share

New Prediction

View Prediction History

UI Components

Use the same design language already used throughout the application.

Rounded corners

18px

Soft shadows

White cards

Light gray background

Green primary buttons

Blue secondary accents

Orange highlights

Large spacing

Minimal modern enterprise SaaS design

Material Design 3 inspired

Glassmorphism only where appropriate

Icons

Use Lucide Icons

Upload

Image

Camera

Leaf

Sprout

Cloud Rain

Droplets

Thermometer

Flask

Bot

Sparkles

Download

Refresh

History

Check Circle

Alert Circle

Animations

Smooth hover effects

Upload animation

Prediction loading animation

Card fade-in

Progress animation

Micro interactions

Button ripple

Image preview transition

Result cards animate sequentially

Responsive Behaviour

Desktop

Two-column layout

Laptop

Two-column layout

Tablet

Image upload above form

Results below

Mobile

Single-column layout

Sticky Predict button

Bottom sheet for results

Camera integration

Touch-friendly controls

Validation

Do not allow prediction until

✔ Soil image uploaded

✔ Nitrogen entered

✔ Phosphorus entered

✔ Potassium entered

✔ Temperature entered

✔ Humidity entered

✔ Soil pH entered

✔ Rainfall entered

Show friendly validation messages.

Backend Awareness

Design the UI assuming the backend accepts multipart/form-data.

The frontend must upload

soil_image (required)
nitrogen
phosphorus
potassium
temperature
humidity
ph
rainfall

The UI must clearly communicate that both the uploaded soil image and the soil/climate parameters are required before AI prediction.

Final Design Goal

Create a premium AI-powered agriculture interface comparable to Google AI Studio, Microsoft Copilot, and ChatGPT, while maintaining the existing AgroAI dashboard design. The Crop Recommendation page should feel like a true multimodal AI prediction tool, with the soil image upload presented as a primary, mandatory input rather than an optional attachment.