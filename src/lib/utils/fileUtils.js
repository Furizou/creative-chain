/**
 * Utility functions for file handling and display
 */

/**
 * Check if a URL points to an image file
 * @param {string} url - The file URL to check
 * @returns {boolean} - True if the URL is an image
 */
export function isImageUrl(url) {
  if (!url) return false;

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const urlLower = url.toLowerCase();

  return imageExtensions.some(ext => urlLower.includes(ext));
}

/**
 * Get the appropriate icon component name for a category
 * @param {string} category - The work category (art, music, photography, other)
 * @returns {string} - The icon name to use
 */
export function getCategoryIcon(category) {
  const categoryLower = category?.toLowerCase();

  const iconMap = {
    'music': 'Music',
    'art': 'Palette',
    'photography': 'Camera',
    'other': 'FileText'
  };

  return iconMap[categoryLower] || 'FileText';
}
