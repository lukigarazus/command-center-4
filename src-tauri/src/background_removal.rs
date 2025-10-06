use image::{DynamicImage, GenericImageView, ImageBuffer, Rgba};
use ndarray::Array4;
use ort::session::Session;
use ort::value::Value;
use std::sync::{Mutex, OnceLock};

static RMBG_MODEL: OnceLock<Mutex<Session>> = OnceLock::new();

const MODEL_INPUT_SIZE: u32 = 1024;

pub fn init_rmbg(model_path: &str) -> Result<(), String> {
    println!("Loading RMBG model from: {}", model_path);
    let session = Session::builder()
        .map_err(|e| format!("Failed to create session builder: {}", e))?
        .commit_from_file(model_path)
        .map_err(|e| format!("Failed to load RMBG model: {}", e))?;

    println!("RMBG model loaded successfully");
    RMBG_MODEL
        .set(Mutex::new(session))
        .map_err(|_| "RMBG model already initialized".to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn remove_background(image_data: Vec<u8>) -> Result<Vec<u8>, String> {
    println!("Starting background removal, image size: {} bytes", image_data.len());

    // Load image from bytes
    println!("Loading image from memory...");
    let img =
        image::load_from_memory(&image_data).map_err(|e| format!("Failed to load image: {}", e))?;
    println!("Image loaded: {}x{}", img.width(), img.height());

    // Process image
    println!("Processing image...");
    let result = process_image(&img).map_err(|e| format!("Failed to remove background: {}", e))?;
    println!("Image processed successfully");

    // Encode as PNG
    println!("Encoding result as PNG...");
    let mut png_bytes = Vec::new();
    result
        .write_to(
            &mut std::io::Cursor::new(&mut png_bytes),
            image::ImageFormat::Png,
        )
        .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    println!("Background removal complete, output size: {} bytes", png_bytes.len());

    Ok(png_bytes)
}

fn process_image(img: &DynamicImage) -> Result<DynamicImage, String> {
    let (orig_width, orig_height) = (img.width(), img.height());
    println!("Original image size: {}x{}", orig_width, orig_height);

    // Resize image to model input size
    println!("Resizing to {}x{}", MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
    let resized = img.resize_exact(
        MODEL_INPUT_SIZE,
        MODEL_INPUT_SIZE,
        image::imageops::FilterType::Lanczos3,
    );

    // Convert to RGB and normalize
    println!("Converting to RGB and normalizing...");
    let rgb_img = resized.to_rgb8();
    let mut input_array = Array4::<f32>::zeros((1, 3, MODEL_INPUT_SIZE as usize, MODEL_INPUT_SIZE as usize));

    // Normalize and convert to CHW format (channels, height, width)
    for c in 0..3 {
        for y in 0..MODEL_INPUT_SIZE {
            for x in 0..MODEL_INPUT_SIZE {
                let pixel = rgb_img.get_pixel(x, y);
                let val = pixel[c as usize] as f32 / 255.0;
                // Normalize to [-1, 1] range (mean=0.5, std=1.0)
                let normalized = (val - 0.5) / 1.0;
                input_array[[0, c as usize, y as usize, x as usize]] = normalized;
            }
        }
    }

    // Create input tensor (from_array takes ownership of the array)
    println!("Creating input tensor...");
    let input_tensor = Value::from_array(input_array)
        .map_err(|e| format!("Failed to create input tensor: {}", e))?;

    // Run inference
    println!("Running model inference...");
    let model = RMBG_MODEL
        .get()
        .ok_or_else(|| "RMBG model not initialized. Model file may be missing.".to_string())?;
    let mut session = model.lock().map_err(|e| format!("Failed to lock session: {}", e))?;
    let outputs = session
        .run(ort::inputs!["input" => input_tensor])
        .map_err(|e| format!("Failed to run inference: {}", e))?;
    println!("Inference complete");

    // Extract output tensor (get first output)
    println!("Extracting output tensor...");
    let output = outputs
        .get("output")
        .ok_or_else(|| "No output from model".to_string())?;

    let (_output_shape, output_data) = output
        .try_extract_tensor::<f32>()
        .map_err(|e| format!("Failed to extract output tensor: {}", e))?;

    // Get the alpha mask (assuming output shape is [1, 1, H, W])
    // Skip batch and channel dimensions to get the mask data
    println!("Processing mask data...");
    let mask_size = (MODEL_INPUT_SIZE * MODEL_INPUT_SIZE) as usize;
    let mask_data: Vec<f32> = output_data.iter().take(mask_size).copied().collect();

    // Find min and max for normalization
    let min_val = mask_data.iter().fold(f32::INFINITY, |a, &b| a.min(b));
    let max_val = mask_data.iter().fold(f32::NEG_INFINITY, |a, &b| a.max(b));
    let range = max_val - min_val;
    println!("Mask range: {} to {}", min_val, max_val);

    // Create mask image
    println!("Creating mask image...");
    let mut mask_img: ImageBuffer<image::Luma<u8>, Vec<u8>> =
        ImageBuffer::new(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

    for (i, pixel) in mask_img.pixels_mut().enumerate() {
        let normalized = if range > 0.0 {
            ((mask_data[i] - min_val) / range * 255.0) as u8
        } else {
            0
        };
        *pixel = image::Luma([normalized]);
    }

    // Resize mask back to original size
    println!("Resizing mask back to {}x{}", orig_width, orig_height);
    let mask_resized = image::DynamicImage::ImageLuma8(mask_img).resize_exact(
        orig_width,
        orig_height,
        image::imageops::FilterType::Lanczos3,
    );

    // Apply mask to original image
    println!("Applying mask to original image...");
    let mut result: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::new(orig_width, orig_height);

    for y in 0..orig_height {
        for x in 0..orig_width {
            let orig_pixel = img.get_pixel(x, y);
            let mask_pixel = mask_resized.get_pixel(x, y);
            let alpha = mask_pixel[0];

            result.put_pixel(
                x,
                y,
                Rgba([orig_pixel[0], orig_pixel[1], orig_pixel[2], alpha]),
            );
        }
    }

    println!("Image processing complete");
    Ok(DynamicImage::ImageRgba8(result))
}
