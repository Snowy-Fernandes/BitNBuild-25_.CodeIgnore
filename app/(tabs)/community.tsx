import React, { useState } from 'react';
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
} from 'react-native';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Plus,
  Camera,
  Send
} from 'lucide-react-native';

// Mock data for posts
const mockPosts = [
  {
    id: 1,
    user: {
      name: 'Sarah Johnson',
      username: 'sarahjcooks',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    },
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
    caption: 'Just made this amazing homemade pizza! The secret is in the dough - let it rise for at least 24 hours. Recipe in my bio! 🍕✨ #homemadepizza #cooking #foodie',
    likes: 1247,
    comments: 89,
    timeAgo: '2h',
    isLiked: false,
    isSaved: false,
  },
  {
    id: 2,
    user: {
      name: 'Chef Marcus',
      username: 'chefmarcus_official',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=400&fit=crop',
    caption: 'Salad doesn\'t have to be boring! This Mediterranean quinoa bowl is packed with flavors and nutrients. Perfect for meal prep too! 🥗💚',
    likes: 892,
    comments: 43,
    timeAgo: '4h',
    isLiked: true,
    isSaved: true,
  },
  {
    id: 3,
    user: {
      name: 'Emma Wellness',
      username: 'emmawellness',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    },
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop',
    caption: 'Sunday pancake vibes! These fluffy beauties are made with oat flour and topped with fresh berries. Who else is having a cozy morning? 🥞☀️',
    likes: 2156,
    comments: 127,
    timeAgo: '6h',
    isLiked: false,
    isSaved: false,
  },
];

const mockComments = [
  { id: 1, user: 'foodlover123', text: 'This looks absolutely delicious! 😍', timeAgo: '1h' },
  { id: 2, user: 'healthyeats', text: 'Can you share the recipe please?', timeAgo: '45m' },
  { id: 3, user: 'cookingninja', text: 'Amazing presentation! 👏', timeAgo: '30m' },
];

export default function CommunityScreen() {
  const [posts, setPosts] = useState(mockPosts);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [selectedPostForComments, setSelectedPostForComments] = useState(null);
  const [newComment, setNewComment] = useState('');

  const handleLike = (postId) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked, 
              likes: post.isLiked ? post.likes - 1 : post.likes + 1 
            }
          : post
      )
    );
  };

  const handleSave = (postId) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, isSaved: !post.isSaved }
          : post
      )
    );
  };

  const handleShare = (post) => {
    Alert.alert('Share Post', `Share "${post.user.name}'s" recipe with friends?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share', onPress: () => console.log('Sharing post...') },
    ]);
  };

  const handleNewPost = () => {
    if (newPostCaption.trim()) {
      const newPost = {
        id: posts.length + 1,
        user: {
          name: 'You',
          username: 'your_username',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        },
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
        caption: newPostCaption,
        likes: 0,
        comments: 0,
        timeAgo: 'now',
        isLiked: false,
        isSaved: false,
      };
      
      setPosts([newPost, ...posts]);
      setNewPostCaption('');
      setShowNewPost(false);
      Alert.alert('Success', 'Your recipe has been shared with the community!');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      // In a real app, you would add the comment to the post
      setNewComment('');
      Alert.alert('Success', 'Comment added!');
      setSelectedPostForComments(null);
    }
  };

  const PostCard = ({ post }) => (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
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

      {/* Post Image */}
      <Image source={{ uri: post.image }} style={styles.postImage} />

      {/* Post Actions */}
      <View style={styles.postActions}>
        <View style={styles.leftActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(post.id)}
          >
            <Heart 
              size={24} 
              color={post.isLiked ? "#EF4444" : "#6B7280"} 
              fill={post.isLiked ? "#EF4444" : "none"}
              strokeWidth={2}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setSelectedPostForComments(post)}
          >
            <MessageCircle size={24} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShare(post)}
          >
            <Share2 size={24} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleSave(post.id)}
        >
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
        {post.comments > 0 && (
          <TouchableOpacity onPress={() => setSelectedPostForComments(post)}>
            <Text style={styles.commentsCount}>View all {post.comments} comments</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity 
          style={styles.newPostButton}
          onPress={() => setShowNewPost(true)}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Posts Feed */}
      <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </ScrollView>

      {/* New Post Modal */}
      <Modal
        visible={showNewPost}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNewPost(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Post</Text>
            <TouchableOpacity onPress={handleNewPost}>
              <Text style={styles.shareButton}>Share</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.newPostContent}>
            <TouchableOpacity style={styles.imageUpload}>
              <Camera size={32} color="#6B7280" />
              <Text style={styles.imageUploadText}>Add Photo</Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.captionInput}
              placeholder="Share your recipe or cooking experience..."
              multiline
              value={newPostCaption}
              onChangeText={setNewPostCaption}
              maxLength={500}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={selectedPostForComments !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedPostForComments(null)}>
              <Text style={styles.cancelButton}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments</Text>
            <View />
          </View>
          
          <ScrollView style={styles.commentsContainer}>
            {mockComments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <View style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <Text style={styles.commentText}>
                    <Text style={styles.commentUsername}>{comment.user} </Text>
                    {comment.text}
                  </Text>
                  <Text style={styles.commentTime}>{comment.timeAgo}</Text>
                </View>
              </View>
            ))}
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
              onPress={handleAddComment}
            >
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
  newPostContent: {
    padding: 24,
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