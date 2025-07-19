import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { formatDistance } from 'date-fns';
import { ArrowLeft, Calendar, Clock, Heart, MessageSquare, Share2, Tag, ThumbsUp } from 'lucide-react';
import { fetchArticleBySlug } from '@/services/articleService';
import { LoadingState } from '@/components/ui/LoadingState';

const ArticlePage = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  // State to store the article and comments
  const [article, setArticle] = useState<any | null>(null); // Adjust the type as per your response structure
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [allComments, setAllComments] = useState<any[]>([]); // Adjust the type as per your response structure
  const [showToast, setShowToast] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchArticleBySlug({ slug });
        setArticle(response.data);
        setAllComments(response.data.comments || []); // Adjust if the response structure differs
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch article');
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle submitting new comment here
  };

  const handleLike = (commentId: string) => {
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
          text: article.description || article.title,
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
                  <time dateTime={article.publishedAt}>
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
            <div
              className="prose prose-lg max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

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
                  <Button variant="ghost" size="sm" className="flex items-center">
                    <Heart size={18} className="mr-2" />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center" onClick={handleShare}>
                    <Share2 size={18} className="mr-2" />
                    Share
                  </Button>
                </div>

                <Link to="#comments" className="flex items-center text-primary">
                  <MessageSquare size={18} className="mr-2" />
                  {allComments.length} {allComments.length === 1 ? 'Comment' : 'Comments'}
                </Link>
              </div>
            </footer>

            <Separator />

            {/* Comments Section */}
            <section id="comments" className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Comments ({allComments.length})</h2>

              {/* Comment Form */}
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

              {/* Comments List */}
              <div className="space-y-6">
                {allComments.map(comment => (
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

                    <div className="flex items-center justify-end">
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
                    </div>
                  </div>
                ))}

                {allComments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-20" />
                    <p>Be the first to comment!</p>
                  </div>
                )}
              </div>
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
