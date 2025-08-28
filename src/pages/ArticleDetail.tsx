import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { formatDistance } from 'date-fns';
import { ArrowLeft, Calendar, Clock, Heart, MessageSquare, Share2, Tag, ThumbsUp } from 'lucide-react';
import { ArticleComment, ArticleData, fetchArticleBySlug, fetchArticleComments, addLikeForArticle, removeLikeForArticle, isLikedByUser } from '@/services/articleService';
import { LoadingState } from '@/components/ui/LoadingState';
import RichContentViewer from '@/components/RichContentViewer';

import { useSelector } from 'react-redux';
import { RootState } from '@/module/store/store';

const ArticlePage = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // State to store the article and comments
  const [article, setArticle] = useState<ArticleData>(null); // Adjust the type as per your response structure
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [allComments, setAllComments] = useState<ArticleComment[]>([]); // Adjust the type as per your response structure
  const [showToast, setShowToast] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);
  // Article like state
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  // Comments pagination/infinite scroll (restored)
  const [showComments, setShowComments] = useState<boolean>(false);
  const [commentsPage, setCommentsPage] = useState<number>(0);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [hasMoreComments, setHasMoreComments] = useState<boolean>(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentsAuthRequired, setCommentsAuthRequired] = useState<boolean>(false);
  const [initialCommentsLoaded, setInitialCommentsLoaded] = useState<boolean>(false);
  const COMMENTS_PAGE_SIZE = 10;
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isLoadingCommentsRef = useRef<boolean>(false);

  useEffect(() => {
    isLoadingCommentsRef.current = isLoadingComments;
  }, [isLoadingComments]);

  const { isAuthenticated } = useSelector((state: RootState) => state.authReducer);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchArticleBySlug({ slug });
        const baseArticle = response.data;
        setArticle(baseArticle);
        setAllComments([]);
        setLoading(false);

        // If user is authenticated, check like status from dedicated endpoint
        if (baseArticle?.id && isAuthenticated) {
          try {
            const likeRes = await isLikedByUser(baseArticle.id);
            const liked = Boolean((likeRes as any)?.data);
            setIsLiked(liked);
          } catch {
            // ignore like status errors
          }
        }
      } catch (err) {
        setError('Failed to fetch article');
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug, isAuthenticated]);

  const handleArticleLike = async () => {
    if (!article?.id || isLiking) return;
    try {
      setIsLiking(true);
      const isCurrentlyLiked = isLiked;
      
      let res;
      if (isCurrentlyLiked) {
        res = await removeLikeForArticle(article.id);
      } else {
        res = await addLikeForArticle(article.id);
      }
      
      const newCount = (res as any)?.data ?? (isCurrentlyLiked ? (article.likeCount || 0) - 1 : (article.likeCount || 0) + 1);
      setArticle(prev => (prev ? { 
        ...prev, 
        likeCount: newCount
      } : prev));
      setIsLiked(!isCurrentlyLiked);
    } catch (e) {
      // no-op: optionally surface a toast/error
    } finally {
      setIsLiking(false);
    }
  };
  
  const loadComments = useCallback(async (nextPage: number) => {
    if (!article?.id || isLoadingCommentsRef.current) return;
    try {
      setIsLoadingComments(true);
      setCommentsError(null);
      const res = await fetchArticleComments({
        articleId: article.id,
        page: nextPage,
        size: COMMENTS_PAGE_SIZE,
      });
      const { models, isLast, totalElements } = res.data || {} as any;
      const items = Array.isArray(models) ? models : [];
      // If backend says there are zero elements, never try to load more
      if (typeof totalElements === 'number' && totalElements === 0) {
        setAllComments([]);
        setHasMoreComments(false);
        setInitialCommentsLoaded(true);
      } else {
        setAllComments(prev => (nextPage === 0 ? items : [...(Array.isArray(prev) ? prev : []), ...items]));
        setHasMoreComments(Boolean(items.length) && isLast === false);
        if (nextPage === 0) setInitialCommentsLoaded(true);
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        setCommentsAuthRequired(true);
        setHasMoreComments(false);
      } else {
        setCommentsError('Failed to load comments');
      }
    } finally {
      setIsLoadingComments(false);
    }
  }, [article?.id]);

  // Trigger first load when user chooses to view comments
  useEffect(() => {
    if (showComments) {
      setCommentsPage(0);
      setCommentsAuthRequired(false);
      setCommentsError(null);
      setInitialCommentsLoaded(false);
      loadComments(0);
    }
  }, [showComments, loadComments]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!showComments) return;
    // Observe only after first page has rendered to avoid immediate auto-trigger
    if (!initialCommentsLoaded) return;
    if (!hasMoreComments) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(entries => {
      const first = entries[0];
      if (first.isIntersecting && hasMoreComments && !isLoadingComments) {
        const next = commentsPage + 1;
        setCommentsPage(next);
        loadComments(next);
      }
    });

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observerRef.current.observe(currentSentinel);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMoreComments, isLoadingComments, showComments, loadComments, initialCommentsLoaded]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article?.id) return;
    const text = (newComment || '').trim();
    if (!text) return;
    try {
      const { addComment } = await import('@/services/articleService');
      await addComment({ comment: text, articleId: article.id });
      setNewComment('');
      // Refresh comments from first page to include the new one
      setCommentsPage(0);
      await loadComments(0);
      // Optionally bump the local comment count
      setArticle(prev => prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        setCommentsAuthRequired(true);
      } else {
        setCommentsError('Failed to post comment');
      }
    }
  };

  const handleLike = (commentId: number) => {
    // Handle liking a comment here
  };

  const triggerToast = () => {
    setShowToast(true);
    setAnimatingOut(false);
    setTimeout(() => {
      setAnimatingOut(true);
      setTimeout(() => setShowToast(false), 400); // Match exit animation
    }, 3000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (error) {
        console.error('Clipboard error:', error);
      }
    }
  };

  // Show a loading spinner or error message if the data is loading or fails to load
  if (loading) {
    return (
      <>
        <div className="container max-w-6xl mx-auto px-4 pt-24 pb-16">
          <LoadingState message="Loading the article..." />
        </div>
      </>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!article) {
    return <div>Article not found.</div>;
  }

  return (
    <>
      <article className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              className="mb-6 flex items-center"
              onClick={() => navigate('/articles')}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Articles
            </Button>

            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center space-x-3 mb-5">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {article.category}
                </span>
                <span className="text-muted-foreground text-sm flex items-center">
                  <Clock size={14} className="mr-1" />
                  {article.readTime} min read
                </span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight mb-6 text-balance">{article.title}</h1>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12">
                    <img src={article.author.avatar} alt={article.author.name} />
                  </Avatar>
                  <div className="ml-3">
                    <p className="font-medium">{article.author.name}</p>
                    <p className="text-muted-foreground text-sm">{article.author.role}</p>
                  </div>
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar size={16} className="mr-1" />
                  <time dateTime={article.createdAt}>
                    {new Date(article.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </time>
                </div>
              </div>
            </header>

            {/* Article Cover Image */}
            <div className="mb-8 rounded-xl overflow-hidden">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Article Content */}
            <RichContentViewer html={article.content} className="mb-12" />

            {/* Article Footer */}
            <footer className="mb-12">
              <div className="flex flex-wrap gap-2 mb-6">
                {article.tags.map(tag => (
                  <Link
                    key={`article.footer-tag-${tag}`}
                    to={`/articles?tag=${tag}`}
                    className="flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm hover:bg-secondary/80 transition-colors"
                  >
                    <Tag size={14} className="mr-1" />
                    {tag}
                  </Link>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" className="flex items-center" onClick={handleArticleLike} disabled={isLiking}>
                                        <Heart size={18} className={`mr-2 ${isLiked ? 'fill-primary text-primary' : ''}`} />
                    {isLiked ? 'Liked' : 'Like'}{typeof article.likeCount === 'number' ? ` (${article.likeCount})` : ''}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center" onClick={handleShare}>
                    <Share2 size={18} className="mr-2" />
                    Share
                  </Button>
                </div>

                <Link to="#comments" className="flex items-center text-primary" onClick={() => setShowComments(true)}>
                  <MessageSquare size={18} className="mr-2" />
                  {article.commentCount} {article.commentCount <= 1 ? 'Comment' : 'Comments'}
                </Link>
              </div>
            </footer>

            <Separator />

            {/* Comments Section */}
            <section id="comments" className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Comments ({article.commentCount})</h2>
                {!showComments && (
                  <Button size="sm" onClick={() => setShowComments(true)}>
                    {article.commentCount === 0 ? 'Write a comment' : 'Load comments'}
                  </Button>
                )}
              </div>

              {/* If auth required */}
              {showComments && commentsAuthRequired && (
                <Card className="mb-8">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">Sign in to view and write comments.</p>
                      <Link to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}>
                        <Button>Sign in</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error state */}
              {showComments && commentsError && !commentsAuthRequired && (
                <Card className="mb-8">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-red-500">{commentsError}</p>
                      <Button variant="outline" onClick={() => loadComments(commentsPage)}>Retry</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comment Form */}
              {showComments && !commentsAuthRequired && (
                <Card className="mb-8">
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmitComment}>
                      <Textarea
                        placeholder="Join the discussion..."
                        className="mb-4 min-h-[100px]"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button type="submit">Post Comment</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Comments List */}
              {showComments && !commentsAuthRequired && (
                <div className="space-y-6">
                  {(Array.isArray(allComments) ? allComments : []).map(comment => (
                    <div key={`article.comment-id-${comment.id}`} className="bg-card p-5 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <img src={comment.author.avatar} alt={comment.author.name} />
                          </Avatar>
                          <div className="ml-3">
                            <p className="font-medium">{comment.author.name}</p>
                            <p className="text-muted-foreground text-xs">{comment.author.role}</p>
                          </div>
                        </div>
                        <time className="text-sm text-muted-foreground">
                          {formatDistance(new Date(comment.createdAt), new Date(), { addSuffix: true })}
                        </time>
                      </div>

                      <p className="text-sm mb-4">{comment.content}</p>

                      {/* <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-primary"
                          onClick={() => handleLike(comment.id)}
                          disabled={comment.liked}
                        >
                          <ThumbsUp size={16} className={`mr-1 ${comment.liked ? 'fill-primary text-primary' : ''}`} />
                          {comment.likes}
                        </Button>
                      </div> */}
                    </div>
                  ))}

                  {(Array.isArray(allComments) ? allComments : []).length === 0 && !isLoadingComments && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-20" />
                      <p>Be the first to comment!</p>
                    </div>
                  )}

                  {/* Loading indicator separate from sentinel */}
                  {isLoadingComments && (
                    <div className="py-4 text-center text-sm text-muted-foreground">Loading comments...</div>
                  )}

                  {/* Sentinel only when there are items and more pages */}
                  {hasMoreComments && (Array.isArray(allComments) ? allComments : []).length > 0 && (
                    <div ref={sentinelRef} className="h-1" />
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </article>
      {showToast && (
        <div className="fixed bottom-6 right-6 transform animate-slide-in bg-gray-500 text-white px-4 py-2 rounded-xl shadow-lg z-50">
          Link copied to clipboard!
        </div>
      )}




    </>
  );
};

export default ArticlePage;
