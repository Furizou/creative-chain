/**
 * Convert data to CSV format and trigger download
 * @param {Array} data - Array of objects to convert to CSV
 * @param {string} filename - Name of the file to download
 */
export function exportToCSV(data, filename) {
  if (!data || !data.length) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first data object
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        let cell = row[header];
        
        // Handle special cases
        if (cell === null || cell === undefined) {
          return '';
        }
        
        // Convert objects/arrays to strings
        if (typeof cell === 'object') {
          cell = JSON.stringify(cell);
        }
        
        // Escape commas and quotes
        cell = String(cell).replace(/"/g, '""');
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          cell = `"${cell}"`;
        }
        
        return cell;
      }).join(',')
    )
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Format chart data for CSV export
 * @param {Object} chartData - Chart data object
 * @param {string} period - Time period filter
 * @param {string} category - Category filter
 * @returns {Array} Formatted data array for CSV export
 */
export function formatChartDataForExport(chartData, period, category) {
  if (!chartData) return [];

  const formattedData = [];
  const dateFormat = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  chartData.datasets.forEach(dataset => {
    dataset.data.forEach((value, index) => {
      formattedData.push({
        Date: dateFormat.format(chartData.labels[index]),
        Category: dataset.label,
        Value: value,
        Period: period,
        FilterCategory: category
      });
    });
  });

  return formattedData;
}
