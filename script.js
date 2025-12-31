// Configuration
const API_URL = 'https://biaswebappenhanceduifastapi.onrender.com'; // Your Render.com URL
let currentStep = 1;
let uploadedColumns = [];
let metadata = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAPIStatus();
    setupEventListeners();
});

// Download Sample CSV
function downloadSampleCSV() {
    // CSV data from the processed_data.csv file
    const csvContent = `Unnamed: 0,age,gender,caste_category,region,income_bracket,health_score,access_to_hospital,treatment_priority
0,45,1,2,3,3,72.5,True,65.2
1,32,0,1,2,2,68.3,True,58.7
2,58,1,3,1,4,81.2,False,72.4
3,29,0,2,3,1,63.8,True,54.3
4,67,1,1,2,5,89.4,True,78.9
5,41,0,3,1,3,75.1,False,66.8
6,36,1,2,3,2,70.6,True,61.2
7,52,0,1,2,4,77.9,True,69.5
8,44,1,3,1,3,73.2,False,64.7
9,61,0,2,3,5,85.6,True,75.3`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('success', 'Download Started', 'Sample CSV file is downloading');
}

// API Status Check
async function checkAPIStatus() {
    const statusDot = document.getElementById('apiStatus');
    const statusText = document.getElementById('apiStatusText');
    
    try {
        console.log('Checking API status at:', API_URL);
        const response = await fetch(`${API_URL}/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log('API Status response:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('API Response:', data);
            
            if (data.status === 'running') {
                statusDot.classList.add('connected');
                statusText.textContent = 'Connected';
                showToast('success', 'API Connected', 'Backend is ready');
            }
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('API Status error:', error);
        statusDot.classList.add('error');
        statusText.textContent = 'Disconnected';
        showToast('error', 'API Error', 'Cannot connect to backend. Check console for details.');
    }
}

// Event Listeners
function setupEventListeners() {
    // File upload
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    fileInput.addEventListener('change', (e) => {
        console.log('File input changed, files:', e.target.files);
        const uploadStatus = document.getElementById('uploadStatus');
        if (e.target.files.length > 0) {
            uploadStatus.textContent = `Selected: ${e.target.files[0].name}`;
            handleFileUpload();
        }
    });
    
    uploadArea.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-primary') || e.target === uploadArea) {
            fileInput.click();
        }
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        console.log('File dropped:', file);
        
        if (file && file.name.endsWith('.csv')) {
            const uploadStatus = document.getElementById('uploadStatus');
            uploadStatus.textContent = `Selected: ${file.name}`;
            
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInput.files = dt.files;
            handleFileUpload();
        } else {
            showToast('error', 'Invalid File', 'Please drop a CSV file');
        }
    });
    
    // Model upload
    const modelInput = document.getElementById('modelInput');
    const modelUploadArea = document.getElementById('modelUploadArea');
    
    modelInput.addEventListener('change', () => {
        console.log('Model input changed');
        handleModelUpload();
    });
    
    modelUploadArea.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-primary') || e.target === modelUploadArea) {
            modelInput.click();
        }
    });
    
    modelUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        modelUploadArea.classList.add('dragover');
    });
    
    modelUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        modelUploadArea.classList.remove('dragover');
    });
    
    modelUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        modelUploadArea.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        console.log('Model dropped:', file);
        
        const validExtensions = ['.joblib', '.pkl', '.pickle'];
        const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (file && validExtensions.includes(fileExt)) {
            const dt = new DataTransfer();
            dt.items.add(file);
            modelInput.files = dt.files;
            handleModelUpload();
        } else {
            showToast('error', 'Invalid File', 'Please drop a .joblib, .pkl, or .pickle file');
        }
    });
    
    // Metadata form
    document.getElementById('metadataForm').addEventListener('submit', handleMetadataSubmit);
    
    // Mitigation form
    document.getElementById('mitigationForm').addEventListener('submit', handleMitigationSubmit);
}

// Handle File Upload
async function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('error', 'No File', 'Please select a CSV file');
        return;
    }
    
    if (!file.name.endsWith('.csv')) {
        showToast('error', 'Invalid File', 'Please upload a CSV file');
        return;
    }
    
    console.log('Uploading file:', file.name, 'Size:', file.size);
    showLoading('Uploading dataset...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_URL}/upload-data`, {
            method: 'POST',
            body: formData
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // Get response text first to see what we're receiving
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        if (!response.ok) {
            let errorMsg = `Server error: ${response.status}`;
            try {
                const errorData = JSON.parse(responseText);
                errorMsg = errorData.detail || errorMsg;
            } catch (e) {
                console.error('Could not parse error response');
            }
            throw new Error(errorMsg);
        }
        
        // Parse the JSON response
        const data = JSON.parse(responseText);
        console.log('Parsed upload response:', data);
        console.log('Data structure:', {
            hasColumns: !!data.columns,
            columnsLength: data.columns?.length,
            hasShape: !!data.shape,
            hasMissing: !!data.missing_values
        });
        
        if (data.columns && Array.isArray(data.columns) && data.columns.length > 0) {
            uploadedColumns = data.columns;
            displayDataInfo(data);
            showToast('success', 'Success', `Dataset uploaded: ${data.shape[0]} rows, ${data.shape[1]} columns`);
        } else {
            console.error('Invalid data structure:', data);
            throw new Error('Invalid response: missing columns data');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('error', 'Upload Failed', error.message);
        hideLoading();
    } finally {
        // Only hide loading if not already hidden
        setTimeout(() => hideLoading(), 100);
    }
}

// Display Data Info
function displayDataInfo(data) {
    console.log('Displaying data info:', data);
    
    document.getElementById('dataRows').textContent = data.shape[0].toLocaleString();
    document.getElementById('dataCols').textContent = data.shape[1];
    
    const columnsList = document.getElementById('columnsList');
    columnsList.innerHTML = data.columns.map(col => 
        `<span class="column-tag">${col}</span>`
    ).join('');
    
    // Handle missing values
    const missingValues = document.getElementById('missingValues');
    const missingList = document.getElementById('missingList');
    
    if (data.missing_values && Object.keys(data.missing_values).length > 0) {
        missingValues.classList.remove('hidden');
        missingList.innerHTML = Object.entries(data.missing_values)
            .map(([col, count]) => `<div>${col}: ${count} missing</div>`)
            .join('');
    } else {
        missingValues.classList.add('hidden');
        missingList.innerHTML = '';
    }
    
    document.getElementById('dataInfo').classList.remove('hidden');
    
    // Smooth scroll to data info
    setTimeout(() => {
        document.getElementById('dataInfo').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }, 100);
}

// Handle Metadata Submit
async function handleMetadataSubmit(e) {
    e.preventDefault();
    
    const target = document.getElementById('targetColumn').value;
    const protectedCheckboxes = document.querySelectorAll('#protectedAttributes input:checked');
    const featureCheckboxes = document.querySelectorAll('#featureColumns input:checked');
    
    const protected = Array.from(protectedCheckboxes).map(cb => cb.value);
    const features = Array.from(featureCheckboxes).map(cb => cb.value);
    
    if (!target || protected.length === 0 || features.length === 0) {
        showToast('error', 'Validation Error', 'Please fill all required fields');
        return;
    }
    
    showLoading('Saving metadata...');
    
    try {
        const response = await fetch(`${API_URL}/set-metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target, protected, features })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            metadata = data.metadata;
            showToast('success', 'Success', 'Metadata saved successfully');
            nextStep(3);
        } else {
            throw new Error(data.detail || 'Failed to save metadata');
        }
    } catch (error) {
        showToast('error', 'Error', error.message);
    } finally {
        hideLoading();
    }
}

// Handle Model Upload
async function handleModelUpload() {
    const modelInput = document.getElementById('modelInput');
    const file = modelInput.files[0];
    
    if (!file) {
        showToast('error', 'No File', 'Please select a model file');
        return;
    }
    
    const validExtensions = ['.joblib', '.pkl', '.pickle'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
        showToast('error', 'Invalid File', 'Please upload a .joblib, .pkl, or .pickle file');
        return;
    }
    
    console.log('Uploading model:', file.name, 'Size:', file.size);
    showLoading('Uploading model and generating predictions...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_URL}/upload-model`, {
            method: 'POST',
            body: formData
        });
        
        console.log('Model upload response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Model upload response:', data);
        
        document.getElementById('biasedRMSE').textContent = data.rmse.toFixed(4);
        document.getElementById('predCount').textContent = data.predictions_count || 'N/A';
        document.getElementById('loadMethod').textContent = data.load_method || 'standard';
        document.getElementById('modelInfo').classList.remove('hidden');
        showToast('success', 'Success', 'Model uploaded and predictions generated');
    } catch (error) {
        console.error('Model upload error:', error);
        showToast('error', 'Upload Failed', error.message);
    } finally {
        hideLoading();
    }
}

// Analyze Bias
async function analyzeBias() {
    showLoading('Analyzing bias in predictions...');
    
    try {
        const response = await fetch(`${API_URL}/analyze-bias`);
        
        console.log('Analyze bias response status:', response.status);
        
        // Get response text first to see what we're receiving
        const responseText = await response.text();
        console.log('Raw analyze response:', responseText);
        
        if (!response.ok) {
            let errorMsg = `Server error: ${response.status}`;
            try {
                const errorData = JSON.parse(responseText);
                errorMsg = errorData.detail || errorMsg;
            } catch (e) {
                console.error('Could not parse error response');
            }
            throw new Error(errorMsg);
        }
        
        const data = JSON.parse(responseText);
        console.log('Parsed analyze response:', data);
        
        displayBiasResults(data);
        document.getElementById('biasResults').classList.remove('hidden');
        showToast('success', 'Analysis Complete', 'Bias analysis finished');
    } catch (error) {
        console.error('Analyze bias error:', error);
        showToast('error', 'Analysis Failed', error.message);
    } finally {
        hideLoading();
    }
}

// Display Bias Results
function displayBiasResults(data) {
    const metricsContainer = document.getElementById('metricsContainer');
    metricsContainer.innerHTML = '';
    
    if (!data.metrics || Object.keys(data.metrics).length === 0) {
        metricsContainer.innerHTML = '<p>No bias metrics available</p>';
        return;
    }
    
    for (const [attr, metrics] of Object.entries(data.metrics)) {
        const metricGroup = document.createElement('div');
        metricGroup.className = 'metric-group';
        
        let metricsHTML = `
            <h4>Protected Attribute: ${attr}</h4>
            <div class="metrics-grid">
                <div class="metric-card">
                    <span class="metric-label">Disparate Impact</span>
                    <span class="metric-value">${metrics.disparate_impact.toFixed(3)}</span>
                </div>
                <div class="metric-card">
                    <span class="metric-label">Statistical Parity Diff</span>
                    <span class="metric-value">${metrics.statistical_parity_diff.toFixed(3)}</span>
                </div>
        `;
        
        // Add group means if available
        if (metrics.group_means) {
            metricsHTML += '<div class="metric-card" style="grid-column: span 2;"><span class="metric-label">Group Means:</span><div style="margin-top: 8px;">';
            for (const [group, mean] of Object.entries(metrics.group_means)) {
                const count = metrics.group_counts ? metrics.group_counts[group] : 'N/A';
                metricsHTML += `<div style="font-size: 14px; margin: 4px 0;"><strong>${group}:</strong> ${mean.toFixed(3)} (n=${count})</div>`;
            }
            metricsHTML += '</div></div>';
        }
        
        metricsHTML += `
                <div class="metric-card">
                    <span class="metric-label">Equal Opportunity Diff</span>
                    <span class="metric-value">${(metrics.equal_opportunity_diff || 0).toFixed(3)}</span>
                </div>
                <div class="metric-card">
                    <span class="metric-label">Average Odds Diff</span>
                    <span class="metric-value">${(metrics.average_odds_diff || 0).toFixed(3)}</span>
                </div>
            </div>
        `;
        
        metricGroup.innerHTML = metricsHTML;
        metricsContainer.appendChild(metricGroup);
    }
    
    // Display plots
    const plotsContainer = document.getElementById('plotsContainer');
    plotsContainer.innerHTML = '';
    
    if (!data.plots || data.plots.length === 0) {
        plotsContainer.innerHTML = '<p>No visualizations available</p>';
        return;
    }
    
    for (const plot of data.plots) {
        const plotCard = document.createElement('div');
        plotCard.className = 'plot-card';
        
        const plotName = plot.split('/').pop();
        plotCard.innerHTML = `
            <h4>${formatPlotName(plotName)}</h4>
            <img src="${API_URL}/download-plot/${plotName}" 
                 alt="${plotName}" 
                 onerror="this.parentElement.innerHTML='<p>Plot not available</p>'">
        `;
        
        plotsContainer.appendChild(plotCard);
    }
}

// Format Plot Name
function formatPlotName(filename) {
    return filename.replace(/_/g, ' ')
        .replace('.png', '')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Handle Mitigation Submit
async function handleMitigationSubmit(e) {
    e.preventDefault();
    
    const technique = document.getElementById('technique').value;
    const protectedAttr = document.getElementById('protectedAttr').value;
    
    if (!technique || !protectedAttr) {
        showToast('error', 'Validation Error', 'Please select technique and attribute');
        return;
    }
    
    showLoading('Applying fairness mitigation...');
    
    try {
        const response = await fetch(`${API_URL}/apply-mitigation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                technique,
                protected_attribute: protectedAttr,
                encoding_method: 'label'
            })
        });
        
        console.log('Mitigation response status:', response.status);
        
        const responseText = await response.text();
        console.log('Raw mitigation response:', responseText);
        
        if (!response.ok) {
            let errorMsg = `Server error: ${response.status}`;
            try {
                const errorData = JSON.parse(responseText);
                errorMsg = errorData.detail || errorMsg;
            } catch (e) {
                console.error('Could not parse error response');
            }
            throw new Error(errorMsg);
        }
        
        const data = JSON.parse(responseText);
        console.log('Parsed mitigation response:', data);
        
        document.getElementById('appliedTechnique').textContent = data.technique;
        document.getElementById('fairModel').textContent = data.model;
        document.getElementById('fairRMSE').textContent = data.rmse.toFixed(4);
        document.getElementById('mitigationResults').classList.remove('hidden');
        
        // Hide the form
        document.getElementById('mitigationForm').style.display = 'none';
        
        showToast('success', 'Mitigation Applied', `${data.technique} applied successfully`);
    } catch (error) {
        console.error('Mitigation error:', error);
        showToast('error', 'Mitigation Failed', error.message);
    } finally {
        hideLoading();
    }
}

// Compare Models
async function compareModels() {
    showLoading('Comparing models...');
    
    try {
        const response = await fetch(`${API_URL}/compare-models`);
        const data = await response.json();
        
        if (response.ok) {
            displayComparison(data);
            document.getElementById('comparisonResults').classList.remove('hidden');
            showToast('success', 'Comparison Complete', 'Models compared successfully');
        } else {
            throw new Error(data.detail || 'Comparison failed');
        }
    } catch (error) {
        showToast('error', 'Comparison Failed', error.message);
    } finally {
        hideLoading();
    }
}

// Display Comparison
function displayComparison(data) {
    // Overall metrics
    const biasedMetrics = document.getElementById('biasedMetrics');
    biasedMetrics.innerHTML = `
        <div class="metric-row">
            <span>RMSE:</span>
            <strong>${data.overall_metrics.biased.rmse.toFixed(4)}</strong>
        </div>
        <div class="metric-row">
            <span>MAE:</span>
            <strong>${data.overall_metrics.biased.mae.toFixed(4)}</strong>
        </div>
        <div class="metric-row">
            <span>R² Score:</span>
            <strong>${data.overall_metrics.biased.r2.toFixed(4)}</strong>
        </div>
    `;
    
    const fairMetrics = document.getElementById('fairMetrics');
    fairMetrics.innerHTML = `
        <div class="metric-row">
            <span>RMSE:</span>
            <strong>${data.overall_metrics.fair.rmse.toFixed(4)}</strong>
        </div>
        <div class="metric-row">
            <span>MAE:</span>
            <strong>${data.overall_metrics.fair.mae.toFixed(4)}</strong>
        </div>
        <div class="metric-row">
            <span>R² Score:</span>
            <strong>${data.overall_metrics.fair.r2.toFixed(4)}</strong>
        </div>
    `;
    
    // Group metrics
    const groupMetrics = document.getElementById('groupMetrics');
    groupMetrics.innerHTML = '';
    
    for (const [attr, groups] of Object.entries(data.group_metrics)) {
        const groupCard = document.createElement('div');
        groupCard.className = 'group-card';
        
        let groupHTML = `<h4>Attribute: ${attr}</h4><div class="group-comparison">`;
        
        for (const [group, metrics] of Object.entries(groups)) {
            groupHTML += `
                <div class="metric-card">
                    <span class="metric-label">Group: ${group}</span>
                    <div style="margin-top: 8px;">
                        <small>Biased RMSE: ${metrics.biased_rmse.toFixed(4)}</small><br>
                        <small>Fair RMSE: ${metrics.fair_rmse.toFixed(4)}</small>
                    </div>
                </div>
            `;
        }
        
        groupHTML += '</div>';
        groupCard.innerHTML = groupHTML;
        groupMetrics.appendChild(groupCard);
    }
}

// Download Functions
async function downloadPredictions(type) {
    try {
        const response = await fetch(`${API_URL}/download-predictions/${type}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_predictions.csv`;
            a.click();
            showToast('success', 'Download Started', `${type} predictions downloading`);
        }
    } catch (error) {
        showToast('error', 'Download Failed', error.message);
    }
}

async function downloadModelCard() {
    try {
        const response = await fetch(`${API_URL}/model-card`);
        const data = await response.json();
        
        if (response.ok) {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'model_card.json';
            a.click();
            showToast('success', 'Download Started', 'Model card downloading');
        }
    } catch (error) {
        showToast('error', 'Download Failed', error.message);
    }
}

// Navigation
function nextStep(step) {
    currentStep = step;
    updateStepUI();
    
    // Populate fields for new steps
    if (step === 2) {
        populateMetadataFields();
    } else if (step === 5) {
        populateMitigationFields();
    }
}

function prevStep(step) {
    currentStep = step;
    updateStepUI();
}

function updateStepUI() {
    // Update progress bar
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    
    // Update sections
    document.querySelectorAll('.section').forEach((section, index) => {
        if (index + 1 === currentStep) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Populate Metadata Fields
function populateMetadataFields() {
    const targetColumn = document.getElementById('targetColumn');
    const protectedAttributes = document.getElementById('protectedAttributes');
    const featureColumns = document.getElementById('featureColumns');
    
    // Target column
    targetColumn.innerHTML = '<option value="">Select target column</option>' +
        uploadedColumns.map(col => `<option value="${col}">${col}</option>`).join('');
    
    // Protected attributes
    protectedAttributes.innerHTML = uploadedColumns.map(col => `
        <div class="checkbox-item">
            <input type="checkbox" id="protected_${col}" value="${col}">
            <label for="protected_${col}">${col}</label>
        </div>
    `).join('');
    
    // Feature columns
    featureColumns.innerHTML = uploadedColumns.map(col => `
        <div class="checkbox-item">
            <input type="checkbox" id="feature_${col}" value="${col}">
            <label for="feature_${col}">${col}</label>
        </div>
    `).join('');
}

// Populate Mitigation Fields
function populateMitigationFields() {
    const protectedAttr = document.getElementById('protectedAttr');
    protectedAttr.innerHTML = '<option value="">Select protected attribute</option>' +
        metadata.protected.map(attr => `<option value="${attr}">${attr}</option>`).join('');
}

// Show Success
function showSuccess() {
    showToast('success', 'Pipeline Complete! 🎉', 'All bias mitigation steps completed successfully');
}

// Loading Overlay
function showLoading(text = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    loadingText.textContent = text;
    overlay.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

// Toast Notifications
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}