import { apiClient, AxiosResponse } from './apiClient';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    image: {
      url: string;
      thumbnail_url: string;
      public_id: string;
      width: number;
      height: number;
      format: string;
      size: number;
      uploaded_by: string;
      purpose: string;
      created_at: string;
    };
  };
}

interface MultipleUploadResponse {
  success: boolean;
  message: string;
  data: {
    images: Array<{
      url: string;
      thumbnail_url: string;
      public_id: string;
      width: number;
      height: number;
      format: string;
      size: number;
      uploaded_by: string;
      purpose: string;
      original_name: string;
      created_at: string;
    }>;
  };
}

interface ImageInfo {
  uri: string;
  width: number;
  height: number;
  type?: string;
  name?: string;
  size?: number;
}

class UploadService {
  /**
   * Compress and optimize image before upload
   */
  async optimizeImage(
    imageUri: string,
    options: {
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<ImageInfo> {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080,
      format = 'jpeg',
    } = options;

    try {
      // Get image info
      const imageInfo = await FileSystem.getInfoAsync(imageUri);
      
      // Manipulate image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight,
            },
          },
        ],
        {
          compress: quality,
          format: format === 'jpeg' ? ImageManipulator.SaveFormat.JPEG : 
                  format === 'png' ? ImageManipulator.SaveFormat.PNG :
                  ImageManipulator.SaveFormat.WEBP,
        }
      );

      return {
        uri: manipulatedImage.uri,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        type: `image/${format}`,
        name: `optimized_image.${format}`,
        size: imageInfo.exists ? imageInfo.size : undefined,
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      // Return original image info if optimization fails
      const imageInfo = await FileSystem.getInfoAsync(imageUri);
      return {
        uri: imageUri,
        width: 0,
        height: 0,
        type: 'image/jpeg',
        name: 'image.jpg',
        size: imageInfo.exists ? imageInfo.size : undefined,
      };
    }
  }

  /**
   * Upload single image
   */
  async uploadImage(
    imageUri: string,
    purpose: 'incident' | 'profile' | 'evidence' = 'incident',
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse<UploadResponse>> {
    // Optimize image before upload
    const optimizedImage = await this.optimizeImage(imageUri);

    return apiClient.uploadFile('/upload/image', optimizedImage, (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = (progressEvent.loaded / progressEvent.total) * 100;
        onProgress(Math.round(progress));
      }
    });
  }

  /**
   * Upload multiple images
   */
  async uploadImages(
    imageUris: string[],
    purpose: 'incident' | 'profile' | 'evidence' = 'incident',
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse<MultipleUploadResponse>> {
    // Optimize all images
    const optimizedImages = await Promise.all(
      imageUris.map(uri => this.optimizeImage(uri))
    );

    return apiClient.uploadFiles('/upload/images', optimizedImages, (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = (progressEvent.loaded / progressEvent.total) * 100;
        onProgress(Math.round(progress));
      }
    });
  }

  /**
   * Delete uploaded image
   */
  async deleteImage(publicId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    const encodedPublicId = encodeURIComponent(publicId);
    return apiClient.delete(`/upload/image/${encodedPublicId}`);
  }

  /**
   * Get image metadata
   */
  async getImageInfo(publicId: string): Promise<AxiosResponse<{
    success: boolean;
    data: {
      image: {
        public_id: string;
        url: string;
        width: number;
        height: number;
        format: string;
        size: number;
        created_at: string;
        tags: string[];
      };
    };
  }>> {
    const encodedPublicId = encodeURIComponent(publicId);
    return apiClient.get(`/upload/image/${encodedPublicId}/info`);
  }

  /**
   * Generate thumbnail URL from image URL
   */
  generateThumbnailUrl(imageUrl: string, width: number = 300, height: number = 300): string {
    // For Cloudinary URLs, we can add transformation parameters
    if (imageUrl.includes('cloudinary.com')) {
      const parts = imageUrl.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/c_fill,w_${width},h_${height},q_auto/${parts[1]}`;
      }
    }
    
    // Return original URL if transformation is not possible
    return imageUrl;
  }

  /**
   * Check if image URL is valid and accessible
   */
  async validateImageUrl(imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Download image to local storage
   */
  async downloadImage(imageUrl: string, filename?: string): Promise<string> {
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        imageUrl,
        FileSystem.documentDirectory + (filename || 'downloaded_image.jpg')
      );

      const result = await downloadResumable.downloadAsync();
      if (result) {
        return result.uri;
      }
      throw new Error('Download failed');
    } catch (error) {
      console.error('Image download failed:', error);
      throw error;
    }
  }

  /**
   * Get upload progress for multiple files
   */
  createUploadProgressTracker(totalFiles: number) {
    let completedFiles = 0;
    const fileProgress: Record<number, number> = {};

    return {
      updateFileProgress: (fileIndex: number, progress: number) => {
        fileProgress[fileIndex] = progress;
        
        // Calculate overall progress
        const totalProgress = Object.values(fileProgress).reduce((sum, p) => sum + p, 0);
        const averageProgress = totalProgress / totalFiles;
        
        return Math.round(averageProgress);
      },
      
      markFileComplete: (fileIndex: number) => {
        fileProgress[fileIndex] = 100;
        completedFiles++;
        
        return {
          completed: completedFiles,
          total: totalFiles,
          percentage: Math.round((completedFiles / totalFiles) * 100),
          isComplete: completedFiles === totalFiles,
        };
      },
      
      getOverallProgress: () => {
        const totalProgress = Object.values(fileProgress).reduce((sum, p) => sum + p, 0);
        return Math.round(totalProgress / totalFiles);
      },
    };
  }

  /**
   * Batch upload with retry logic
   */
  async batchUploadWithRetry(
    imageUris: string[],
    purpose: 'incident' | 'profile' | 'evidence' = 'incident',
    maxRetries: number = 3,
    onProgress?: (progress: number, completed: number, total: number) => void
  ): Promise<string[]> {
    const uploadedUrls: string[] = [];
    const progressTracker = this.createUploadProgressTracker(imageUris.length);

    for (let i = 0; i < imageUris.length; i++) {
      const imageUri = imageUris[i];
      let retries = 0;
      let uploaded = false;

      while (retries < maxRetries && !uploaded) {
        try {
          const response = await this.uploadImage(imageUri, purpose, (progress) => {
            const overallProgress = progressTracker.updateFileProgress(i, progress);
            onProgress?.(overallProgress, i, imageUris.length);
          });

          uploadedUrls.push(response.data.data.image.url);
          uploaded = true;

          const status = progressTracker.markFileComplete(i);
          onProgress?.(status.percentage, status.completed, status.total);

        } catch (error) {
          retries++;
          console.error(`Upload attempt ${retries} failed for image ${i}:`, error);
          
          if (retries >= maxRetries) {
            throw new Error(`Failed to upload image ${i} after ${maxRetries} attempts`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }

    return uploadedUrls;
  }
}

export const uploadService = new UploadService();
export type { UploadResponse, MultipleUploadResponse, ImageInfo };
