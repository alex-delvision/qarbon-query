// Rust source for high-performance emissions calculations
// This will be compiled to WebAssembly for optimal performance

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global allocator
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
    
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Macro for logging to console
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

/// Calculate emissions for a batch of inputs using vectorized operations
#[wasm_bindgen]
pub fn calculate_emissions_batch(
    values: &[f64],
    factors: &[f64],
    results: &mut [f64],
) -> bool {
    if values.len() != factors.len() || values.len() != results.len() {
        return false;
    }

    // Vectorized calculation with potential SIMD optimizations
    // The Rust compiler will automatically vectorize this when possible
    for i in 0..values.len() {
        results[i] = values[i] * factors[i];
    }

    true
}

/// Optimized calculation for transport emissions
#[wasm_bindgen]
pub fn calculate_transport_emissions(
    distances: &[f64],
    factors: &[f64],
    results: &mut [f64],
) -> bool {
    if distances.len() != factors.len() || distances.len() != results.len() {
        return false;
    }

    // Specialized calculation for transport (distance * factor)
    for i in 0..distances.len() {
        results[i] = distances[i] * factors[i];
    }

    true
}

/// Optimized calculation for energy emissions
#[wasm_bindgen]
pub fn calculate_energy_emissions(
    consumption: &[f64],
    factors: &[f64],
    results: &mut [f64],
) -> bool {
    if consumption.len() != factors.len() || consumption.len() != results.len() {
        return false;
    }

    // Specialized calculation for energy (consumption * factor)
    for i in 0..consumption.len() {
        results[i] = consumption[i] * factors[i];
    }

    true
}

/// Optimized calculation for AI emissions with token-based factors
#[wasm_bindgen]
pub fn calculate_ai_emissions(
    tokens: &[f64],
    co2_per_token: &[f64],
    co2_per_query: &[f64],
    results: &mut [f64],
) -> bool {
    if tokens.len() != co2_per_token.len() 
        || tokens.len() != co2_per_query.len() 
        || tokens.len() != results.len() {
        return false;
    }

    // AI-specific calculation logic
    for i in 0..tokens.len() {
        if tokens[i] > 0.0 {
            results[i] = tokens[i] * co2_per_token[i];
        } else {
            results[i] = co2_per_query[i];
        }
    }

    true
}

/// Memory allocation for WASM heap
#[wasm_bindgen]
pub fn allocate(size: usize) -> *mut f64 {
    let mut vec = Vec::<f64>::with_capacity(size);
    let ptr = vec.as_mut_ptr();
    std::mem::forget(vec);
    ptr
}

/// Memory deallocation for WASM heap
#[wasm_bindgen]
pub fn deallocate(ptr: *mut f64, size: usize) {
    unsafe {
        let _ = Vec::from_raw_parts(ptr, size, size);
    }
}

/// Vectorized sum calculation
#[wasm_bindgen]
pub fn vector_sum(values: &[f64]) -> f64 {
    values.iter().sum()
}

/// Vectorized average calculation
#[wasm_bindgen]
pub fn vector_average(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    vector_sum(values) / values.len() as f64
}

/// Vectorized minimum calculation
#[wasm_bindgen]
pub fn vector_min(values: &[f64]) -> f64 {
    values.iter().fold(f64::INFINITY, |a, &b| a.min(b))
}

/// Vectorized maximum calculation
#[wasm_bindgen]
pub fn vector_max(values: &[f64]) -> f64 {
    values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b))
}

/// Scale all values by a factor
#[wasm_bindgen]
pub fn vector_scale(values: &mut [f64], factor: f64) {
    for value in values.iter_mut() {
        *value *= factor;
    }
}

/// Add two vectors element-wise
#[wasm_bindgen]
pub fn vector_add(a: &[f64], b: &[f64], result: &mut [f64]) -> bool {
    if a.len() != b.len() || a.len() != result.len() {
        return false;
    }

    for i in 0..a.len() {
        result[i] = a[i] + b[i];
    }

    true
}

/// Multiply two vectors element-wise
#[wasm_bindgen]
pub fn vector_multiply(a: &[f64], b: &[f64], result: &mut [f64]) -> bool {
    if a.len() != b.len() || a.len() != result.len() {
        return false;
    }

    for i in 0..a.len() {
        result[i] = a[i] * b[i];
    }

    true
}

/// Calculate weighted average
#[wasm_bindgen]
pub fn weighted_average(values: &[f64], weights: &[f64]) -> f64 {
    if values.len() != weights.len() || values.is_empty() {
        return 0.0;
    }

    let mut weighted_sum = 0.0;
    let mut weight_sum = 0.0;

    for i in 0..values.len() {
        weighted_sum += values[i] * weights[i];
        weight_sum += weights[i];
    }

    if weight_sum > 0.0 {
        weighted_sum / weight_sum
    } else {
        0.0
    }
}

/// Performance benchmarking function
#[wasm_bindgen]
pub fn benchmark_calculation(size: usize, iterations: usize) -> f64 {
    let values: Vec<f64> = (0..size).map(|i| i as f64).collect();
    let factors: Vec<f64> = vec![0.5; size];
    let mut results = vec![0.0; size];

    let start = js_sys::Date::now();

    for _ in 0..iterations {
        calculate_emissions_batch(&values, &factors, &mut results);
    }

    js_sys::Date::now() - start
}

/// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn main() {
    console_log!("Qarbon emissions WASM module initialized");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_emissions_batch() {
        let values = [100.0, 200.0, 300.0];
        let factors = [0.5, 0.3, 0.2];
        let mut results = [0.0; 3];

        assert!(calculate_emissions_batch(&values, &factors, &mut results));
        assert_eq!(results[0], 50.0);
        assert_eq!(results[1], 60.0);
        assert_eq!(results[2], 60.0);
    }

    #[test]
    fn test_vector_operations() {
        let values = [1.0, 2.0, 3.0, 4.0, 5.0];
        
        assert_eq!(vector_sum(&values), 15.0);
        assert_eq!(vector_average(&values), 3.0);
        assert_eq!(vector_min(&values), 1.0);
        assert_eq!(vector_max(&values), 5.0);
    }

    #[test]
    fn test_vector_math() {
        let a = [1.0, 2.0, 3.0];
        let b = [4.0, 5.0, 6.0];
        let mut result = [0.0; 3];

        assert!(vector_add(&a, &b, &mut result));
        assert_eq!(result, [5.0, 7.0, 9.0]);

        assert!(vector_multiply(&a, &b, &mut result));
        assert_eq!(result, [4.0, 10.0, 18.0]);
    }
}
