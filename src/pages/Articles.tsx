import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { CalendarIcon, Clock, Tag } from 'lucide-react';
import { articles } from '@/data/articles';
import { formatDistance } from 'date-fns';

const Articles: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-3 text-balance">Our Blog</h1>
            <p className="text-lg text-muted-foreground">
              Insights and guides about pet care, sustainability, and eco-friendly products.
            </p>
          </header>

          <div className="space-y-10">
            {articles.map((article) => (
              <Card key={article.id} className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 h-60 md:h-auto relative">
                    <img 
                      src={article.coverImage} 
                      alt={article.title}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="md:w-2/3 flex flex-col">
                    <CardHeader>
                      <div className="flex items-center mb-2 text-sm text-muted-foreground">
                        <span className="bg-accent px-3 py-1 rounded-full">
                          {article.category}
                        </span>
                      </div>
                      <CardTitle className="text-2xl">
                        <Link 
                          to={`/articles/${article.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {article.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {article.excerpt}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {article.tags.map(tag => (
                          <span key={tag} className="flex items-center text-xs text-muted-foreground">
                            <Tag size={12} className="mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-2 mt-auto flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8">
                          <img src={article.author.avatar} alt={article.author.name} />
                        </Avatar>
                        <div className="ml-2 text-sm">
                          <p className="font-medium">{article.author.name}</p>
                          <p className="text-muted-foreground text-xs">{article.author.role}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarIcon size={14} className="mr-1" />
                        <span className="mr-3">
                          {formatDistance(new Date(article.publishedAt), new Date(), { addSuffix: true })}
                        </span>
                        <Clock size={14} className="mr-1" />
                        <span>{article.readTime} min read</span>
                      </div>
                    </CardFooter>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Articles;