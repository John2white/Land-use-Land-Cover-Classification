# 🌍 Land Cover Classification and Change Detection in Kisumu

This repository contains Google Earth Engine (GEE) code for analyzing land cover changes in Kisumu using Sentinel-2 imagery. The project involves NDVI computation, supervised classification, accuracy assessment, and change detection over the years 2020 and 2024.

---

## 📂 Project Structure

```plaintext
├── scripts/               # GEE code for land cover classification and analysis
├── exports/               # Data and images exported to Google Drive
├── outputs/               # Classified images and charts
└── README.md              # Documentation
✨ Features
NDVI Calculation:
Calculates NDVI for 2020 and 2024 to analyze vegetation health.
Land Cover Classification:
Supervised classification with classes: Water, Vegetation, Built-up, and Bareland.
Accuracy Assessment:
Confusion matrix for classifier evaluation.
Change Detection:
Binary map to identify land cover changes between 2020 and 2024.
Area Calculation:
Computes area of each land cover class in hectares.
Visualization:
Maps, legends, and comparative charts.
🚀 Getting Started
Prerequisites
Google Earth Engine account.
Feature collections for training data in GEE assets.
Sentinel-2 imagery access.
Setup
Clone this repository to your local environment:
bash
Copy code
git clone https://github.com/your-username/land-cover-classification.git
Open the Google Earth Engine script editor and paste the code from scripts/land_cover_analysis.js.
Replace placeholders for AOI and training data paths with your GEE assets.
Running the Code
The script processes Sentinel-2 imagery, performs classification, and generates outputs.
Export results (classified images and training data) to Google Drive for further analysis.
📊 Outputs
Classified Images: Land cover maps for 2020 and 2024.
Change Detection: Binary map indicating changes.
Area Statistics: Comparative charts of land cover areas.
Training Data: Exported as CSV for external analysis.
📧 Contact
For questions or feedback, reach out to:
Your John Odero
Email: johnwuorodero@gmail.com
GitHub: John2white
