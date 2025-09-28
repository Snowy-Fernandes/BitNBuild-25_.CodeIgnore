import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Plus,
  Camera,
  Send,
  X
} from 'lucide-react-native';

// Enhanced Post interface
interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface Post {
  id: string;
  user: User;
  image: string; // This will now store base64 data or URL
  caption: string;
  likes: number;
  comments: Comment[];
  timeAgo: string;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: number;
  imageType: 'url' | 'base64'; // Add this to track image type
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timeAgo: string;
  createdAt: number;
}

// Storage keys
const STORAGE_KEYS = {
  POSTS: '@community_posts',
  USER_PROFILE: '@user_profile',
  LIKED_POSTS: '@liked_posts',
  SAVED_POSTS: '@saved_posts',
};

// Default user profile
const DEFAULT_USER: User = {
  id: 'current_user',
  name: 'You',
  username: 'your_username',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
};

// Fixed initial mock posts with working image URLs
const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    user: {
      id: '2',
      name: 'Sarah Johnson',
      username: 'sarahjcooks',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    },
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
    caption: 'Just made this amazing homemade pizza! The secret is in the dough - let it rise for at least 24 hours. Recipe in my bio!',
    likes: 1247,
    comments: [
      {
        id: '1',
        userId: '3',
        username: 'foodlover123',
        text: 'This looks absolutely delicious!',
        timeAgo: '1h',
        createdAt: Date.now() - 3600000,
      }
    ],
    timeAgo: '2h',
    isLiked: false,
    isSaved: false,
    createdAt: Date.now() - 7200000,
    imageType: 'url',
  },
  {
    id: '2',
    user: {
      id: '4',
      name: 'Chef Marcus',
      username: 'chefmarcus_official',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=400&fit=crop',
    caption: 'Salad doesn\'t have to be boring! This Mediterranean quinoa bowl is packed with flavors and nutrients. Perfect for meal prep too!',
    likes: 892,
    comments: [],
    timeAgo: '4h',
    isLiked: true,
    isSaved: true,
    createdAt: Date.now() - 14400000,
    imageType: 'url',
  },
  {
    id: '3',
    user: {
      id: '5',
      name: 'Dosa Master',
      username: 'dosaking',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    },
    image: 'https://images.unsplash.com/photo-1586197132057-3d5c58f76c64?w=400&h=400&fit=crop',
    caption: 'Perfect crispy dosa made this morning! Secret family recipe passed down for generations.',
    likes: 567,
    comments: [],
    timeAgo: '15m',
    isLiked: false,
    isSaved: false,
    createdAt: Date.now() - 900000,
    imageType: 'url',
  },
];

// Enhanced function to get image source with better error handling
const getImageSource = (image: string, imageType: 'url' | 'base64') => {
  if (imageType === 'base64') {
    return { uri: `data:image/jpeg;base64,${image}` };
  }
  
  // For URL images, return with cache control
  return { 
    uri: image,
    cache: 'force-cache'
  };
};

// Utility function to convert image URI to base64
const convertImageToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

export default function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostImageType, setNewPostImageType] = useState<'url' | 'base64'>('url');
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [isConvertingImage, setIsConvertingImage] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  // Storage functions
  const loadFromStorage = async (key: string, defaultValue: any = null) => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return defaultValue;
    }
  };

  const saveToStorage = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  // Initialize data on app start
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      let savedPosts = await loadFromStorage(STORAGE_KEYS.POSTS);
      if (!savedPosts || savedPosts.length === 0) {
        savedPosts = INITIAL_POSTS;
        await saveToStorage(STORAGE_KEYS.POSTS, savedPosts);
      }

      const updatedPosts = savedPosts.map((post: Post) => ({
        ...post,
        timeAgo: getTimeAgo(post.createdAt),
        comments: post.comments.map((comment: Comment) => ({
          ...comment,
          timeAgo: getTimeAgo(comment.createdAt),
        })),
      }));

      setPosts(updatedPosts);

      const savedUser = await loadFromStorage(STORAGE_KEYS.USER_PROFILE);
      if (savedUser) {
        setCurrentUser(savedUser);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      setPosts(INITIAL_POSTS);
    }
  };

  // Calculate time ago
  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  };

  // Generate unique ID
  const generateId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Refresh posts
  const onRefresh = async () => {
    setRefreshing(true);
    await initializeData();
    setRefreshing(false);
  };

  // Handle image load errors
  const handleImageError = (postId: string) => {
    setImageLoadErrors(prev => new Set(prev).add(postId));
  };

  // Get fallback image for failed loads
  const getFallbackImage = () => {
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop';
  };

  // Like handler
  const handleLike = async (postId: string) => {
    try {
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          const newIsLiked = !post.isLiked;
          return {
            ...post,
            isLiked: newIsLiked,
            likes: newIsLiked ? post.likes + 1 : post.likes - 1
          };
        }
        return post;
      });

      setPosts(updatedPosts);
      await saveToStorage(STORAGE_KEYS.POSTS, updatedPosts);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  // Save handler
  const handleSave = async (postId: string) => {
    try {
      const updatedPosts = posts.map(post =>
        post.id === postId
          ? { ...post, isSaved: !post.isSaved }
          : post
      );

      setPosts(updatedPosts);
      await saveToStorage(STORAGE_KEYS.POSTS, updatedPosts);
    } catch (error) {
      console.error('Error updating save:', error);
    }
  };

  // Share handler
  const handleShare = (post: Post) => {
    Alert.alert('Share Post', `Share "${post.user.name}'s" recipe with friends?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Share', 
        onPress: () => {
          Alert.alert('Shared!', 'Post shared successfully!');
        }
      },
    ]);
  };

  // Image picker for new posts
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      setIsConvertingImage(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        if (result.assets[0].base64) {
          setNewPostImage(result.assets[0].base64);
          setNewPostImageType('base64');
        } else {
          const base64Data = await convertImageToBase64(result.assets[0].uri);
          setNewPostImage(base64Data);
          setNewPostImageType('base64');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setIsConvertingImage(false);
    }
  };

  // Take photo for new posts
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
        return;
      }

      setIsConvertingImage(true);

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        if (result.assets[0].base64) {
          setNewPostImage(result.assets[0].base64);
          setNewPostImageType('base64');
        } else {
          const base64Data = await convertImageToBase64(result.assets[0].uri);
          setNewPostImage(base64Data);
          setNewPostImageType('base64');
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setIsConvertingImage(false);
    }
  };

  // New post handler
  const handleNewPost = async () => {
    if (!newPostCaption.trim()) {
      Alert.alert('Caption Required', 'Please add a caption for your post');
      return;
    }

    if (!newPostImage) {
      Alert.alert('Image Required', 'Please add an image to your post');
      return;
    }

    if (isConvertingImage) {
      Alert.alert('Please Wait', 'Image is still being processed');
      return;
    }

    try {
      const newPost: Post = {
        id: generateId(),
        user: currentUser,
        image: newPostImage,
        caption: newPostCaption.trim(),
        likes: 0,
        comments: [],
        timeAgo: 'now',
        isLiked: false,
        isSaved: false,
        createdAt: Date.now(),
        imageType: newPostImageType,
      };

      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      await saveToStorage(STORAGE_KEYS.POSTS, updatedPosts);

      setNewPostCaption('');
      setNewPostImage(null);
      setNewPostImageType('url');
      setShowNewPost(false);
      Alert.alert('Success', 'Your recipe has been shared with the community!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  // Add comment handler
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPostForComments) return;

    try {
      const newCommentObj: Comment = {
        id: generateId(),
        userId: currentUser.id,
        username: currentUser.username,
        text: newComment.trim(),
        timeAgo: 'now',
        createdAt: Date.now(),
      };

      const updatedPosts = posts.map(post => {
        if (post.id === selectedPostForComments.id) {
          return {
            ...post,
            comments: [...post.comments, newCommentObj]
          };
        }
        return post;
      });

      setPosts(updatedPosts);
      await saveToStorage(STORAGE_KEYS.POSTS, updatedPosts);
      
      setNewComment('');
      Alert.alert('Success', 'Comment added!');
      setSelectedPostForComments(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  // Enhanced Post Card Component with better image handling
  const PostCard = ({ post }: { post: Post }) => {
    const [imageError, setImageError] = useState(false);
    
    const imageSource = imageError 
      ? { uri: getFallbackImage() }
      : getImageSource(post.image, post.imageType);

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: post.user.avatar }} 
              style={styles.avatar}
              onError={() => console.log('Avatar load error')}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{post.user.name}</Text>
              <Text style={styles.username}>@{post.user.username}</Text>
            </View>
          </View>
          <View style={styles.postMeta}>
            <Text style={styles.timeAgo}>{post.timeAgo}</Text>
            <TouchableOpacity style={styles.moreButton}>
              <MoreHorizontal size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Post Image with Error Handling */}
        <Image 
          source={imageSource}
          style={styles.postImage}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />

        {/* Post Actions */}
        <View style={styles.postActions}>
          <View style={styles.leftActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(post.id)}>
              <Heart
                size={24}
                color={post.isLiked ? "#EF4444" : "#6B7280"}
                fill={post.isLiked ? "#EF4444" : "none"}
                strokeWidth={2}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setSelectedPostForComments(post)}>
              <MessageCircle size={24} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(post)}>
              <Share2 size={24} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSave(post.id)}>
            <Bookmark
              size={24}
              color={post.isSaved ? "#6C8BE6" : "#6B7280"}
              fill={post.isSaved ? "#6C8BE6" : "none"}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* Post Stats */}
        <View style={styles.postStats}>
          <Text style={styles.likesCount}>{post.likes.toLocaleString()} likes</Text>
          {post.comments.length > 0 && (
            <TouchableOpacity onPress={() => setSelectedPostForComments(post)}>
              <Text style={styles.commentsCount}>
                View all {post.comments.length} comments
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Post Caption */}
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{post.user.username} </Text>
            {post.caption}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity
          style={styles.newPostButton}
          onPress={() => setShowNewPost(true)}>
          <Plus size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Posts Feed */}
      <ScrollView 
        style={styles.feed} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        
        {posts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No posts yet. Be the first to share!</Text>
          </View>
        )}
      </ScrollView>

      {/* New Post Modal */}
      <Modal
        visible={showNewPost}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowNewPost(false);
              setNewPostImage(null);
              setNewPostCaption('');
              setNewPostImageType('url');
            }}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Post</Text>
            <TouchableOpacity onPress={handleNewPost} disabled={isConvertingImage}>
              <Text style={[styles.shareButton, isConvertingImage && styles.disabledButton]}>
                {isConvertingImage ? 'Processing...' : 'Share'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.newPostContent}>
            {/* Image Section */}
            <View style={styles.imageSection}>
              {newPostImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image 
                    source={getImageSource(newPostImage, newPostImageType)} 
                    style={styles.selectedImage} 
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setNewPostImage(null);
                      setNewPostImageType('url');
                    }}>
                    <X size={20} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imageUpload}>
                  <Camera size={32} color="#6B7280" />
                  <Text style={styles.imageUploadText}>Add Photo</Text>
                  <View style={styles.imageButtons}>
                    <TouchableOpacity 
                      style={styles.imageButton} 
                      onPress={takePhoto}
                      disabled={isConvertingImage}
                    >
                      <Text style={styles.imageButtonText}>
                        {isConvertingImage ? 'Processing...' : 'Camera'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.imageButton} 
                      onPress={pickImage}
                      disabled={isConvertingImage}
                    >
                      <Text style={styles.imageButtonText}>
                        {isConvertingImage ? 'Processing...' : 'Gallery'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Caption Input */}
            <TextInput
              style={styles.captionInput}
              placeholder="Share your recipe or cooking experience..."
              multiline
              value={newPostCaption}
              onChangeText={setNewPostCaption}
              maxLength={500}
              textAlignVertical="top"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={selectedPostForComments !== null}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedPostForComments(null)}>
              <Text style={styles.cancelButton}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments</Text>
            <View />
          </View>
          
          <ScrollView style={styles.commentsContainer}>
            {selectedPostForComments?.comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Image source={{ uri: currentUser.avatar }} style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <Text style={styles.commentText}>
                    <Text style={styles.commentUsername}>{comment.username} </Text>
                    {comment.text}
                  </Text>
                  <Text style={styles.commentTime}>{comment.timeAgo}</Text>
                </View>
              </View>
            ))}
            
            {selectedPostForComments?.comments.length === 0 && (
              <View style={styles.noCommentsContainer}>
                <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.commentInput}>
            <TextInput
              style={styles.commentTextInput}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              style={styles.commentSendButton}
              onPress={handleAddComment}>
              <Send size={20} color="#6C8BE6" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  newPostButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C8BE6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C8BE6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  feed: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  username: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeAgo: {
    fontSize: 14,
    color: '#6B7280',
  },
  moreButton: {
    padding: 4,
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F3F4F6',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  postStats: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  likesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  commentsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  caption: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  shareButton: {
    fontSize: 16,
    color: '#6C8BE6',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  newPostContent: {
    flex: 1,
    padding: 24,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageUpload: {
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imageUploadText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 12,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    backgroundColor: '#6C8BE6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  selectedImageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  commentsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  comment: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  commentUsername: {
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 12,
  },
  commentSendButton: {
    padding: 8,
  },
});