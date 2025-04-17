// import React from 'react';
// import { Link } from 'react-router-dom';
// import { Navbar } from '@/components/layout/Navbar';
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// import { Avatar } from '@/components/ui/avatar';
// import { CalendarIcon, Clock, Tag } from 'lucide-react';
// import { articles } from '@/data/articles';
// import { formatDistance } from 'date-fns';

// const Articles: React.FC = () => {
//   return (
//     <>
//       <Navbar />
//       <div className="pt-24 pb-16 container mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="max-w-4xl mx-auto">
//           <header className="mb-12">
//             <h1 className="text-4xl font-bold tracking-tight mb-3 text-balance">Our Blog</h1>
//             <p className="text-lg text-muted-foreground">
//               Insights and guides about pet care, sustainability, and eco-friendly products.
//             </p>
//           </header>

//           <div className="space-y-10">
//             {articles.map((article) => (
//               <Card key={article.id} className="overflow-hidden transition-all duration-300 hover:shadow-lg">
//                 <div className="flex flex-col md:flex-row">
//                   <div className="md:w-1/3 h-60 md:h-auto relative">
//                     <img 
//                       src={article.coverImage} 
//                       alt={article.title}
//                       className="w-full h-full object-cover" 
//                     />
//                   </div>
//                   <div className="md:w-2/3 flex flex-col">
//                     <CardHeader>
//                       <div className="flex items-center mb-2 text-sm text-muted-foreground">
//                         <span className="bg-accent px-3 py-1 rounded-full">
//                           {article.category}
//                         </span>
//                       </div>
//                       <CardTitle className="text-2xl">
//                         <Link 
//                           to={`/articles/${article.id}`}
//                           className="hover:text-primary transition-colors"
//                         >
//                           {article.title}
//                         </Link>
//                       </CardTitle>
//                       <CardDescription className="line-clamp-2">
//                         {article.excerpt}
//                       </CardDescription>
//                     </CardHeader>

//                     <CardContent>
//                       <div className="flex flex-wrap gap-2 mb-4">
//                         {article.tags.map(tag => (
//                           <span key={tag} className="flex items-center text-xs text-muted-foreground">
//                             <Tag size={12} className="mr-1" />
//                             {tag}
//                           </span>
//                         ))}
//                       </div>
//                     </CardContent>

//                     <CardFooter className="pt-2 mt-auto flex items-center justify-between">
//                       <div className="flex items-center">
//                         <Avatar className="h-8 w-8">
//                           <img src={article.author.avatar} alt={article.author.name} />
//                         </Avatar>
//                         <div className="ml-2 text-sm">
//                           <p className="font-medium">{article.author.name}</p>
//                           <p className="text-muted-foreground text-xs">{article.author.role}</p>
//                         </div>
//                       </div>

//                       <div className="flex items-center text-sm text-muted-foreground">
//                         <CalendarIcon size={14} className="mr-1" />
//                         <span className="mr-3">
//                           {formatDistance(new Date(article.publishedAt), new Date(), { addSuffix: true })}
//                         </span>
//                         <Clock size={14} className="mr-1" />
//                         <span>{article.readTime} min read</span>
//                       </div>
//                     </CardFooter>
//                   </div>
//                 </div>
//               </Card>
//             ))}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Articles;

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { CalendarIcon, Clock, Tag } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { fetchArticles } from '@/services/articleService';
import { ArticleList } from './Interface/PagesInterface';

const Articles: React.FC = () => {
  const [articles, setArticles] = useState<ArticleList[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadArticles = useCallback(async () => {
    if (!hasMore) return;
    try {
      const response = await fetchArticles({
        page,
        size: 6,
        body: {
          name: null, // or a real filter if you want to support search
        },
      });

      const newArticles = response.data.models;
      setArticles(prev => [...prev, ...newArticles]);
      setHasMore(!response.data.isLast);
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  }, [page, hasMore]);

  useEffect(() => {
    loadArticles();
  }, [page]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });

    if (loaderRef.current) observer.current.observe(loaderRef.current);
  }, [hasMore]);

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
            {articles.map((article, index) => (
              <Card key={`${article.slug}-${index}`} className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 h-60 md:h-auto relative">
                    <Link to={`/article/${article.slug}`} className="hover:text-primary">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  </div>
                  <div className="md:w-2/3 flex flex-col">
                    <CardHeader>
                      <div className="flex items-center mb-2 text-sm text-muted-foreground">
                        <span className="bg-accent px-3 py-1 rounded-full">{article.category}</span>
                      </div>
                      <CardTitle className="text-2xl">
                        <Link to={`/article/${article.slug}`} className="hover:text-primary transition-colors">
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
                          {formatDistance(new Date(article.createdAt), new Date(), { addSuffix: true })}
                        </span>
                        <Clock size={14} className="mr-1" />
                        <span>{article.readTime} min read</span>
                      </div>
                    </CardFooter>
                  </div>
                </div>
              </Card>
            ))}
            {hasMore ? (
              <div ref={loaderRef} className="text-center py-10 text-muted-foreground">
                Loading more articles...
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                🎉 You've reached the end!
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // return (
  //       <>
  //         <Navbar />
  //         <div className="pt-24 pb-16 container mx-auto px-4 sm:px-6 lg:px-8">
  //           <div className="max-w-4xl mx-auto">
  //             <header className="mb-12">
  //               <h1 className="text-4xl font-bold tracking-tight mb-3 text-balance">Our Blog</h1>
  //               <p className="text-lg text-muted-foreground">
  //                 Insights and guides about pet care, sustainability, and eco-friendly products.
  //               </p>
  //             </header>

  //             <div className="space-y-10">
  //               {articles.map((article) => (
  //                 <Card key={article.slug} className="overflow-hidden transition-all duration-300 hover:shadow-lg">
  //                   <div className="flex flex-col md:flex-row">
  //                     <div className="md:w-1/3 h-60 md:h-auto relative">
  //                       <img 
  //                         src={article.coverImage} 
  //                         alt={article.title}
  //                         className="w-full h-full object-cover" 
  //                       />
  //                     </div>
  //                     <div className="md:w-2/3 flex flex-col">
  //                       <CardHeader>
  //                         <div className="flex items-center mb-2 text-sm text-muted-foreground">
  //                           <span className="bg-accent px-3 py-1 rounded-full">
  //                             {article.category}
  //                           </span>
  //                         </div>
  //                         <CardTitle className="text-2xl">
  //                           <Link 
  //                             to={`/articles/${article.slug}`}
  //                             className="hover:text-primary transition-colors"
  //                           >
  //                             {article.title}
  //                           </Link>
  //                         </CardTitle>
  //                         <CardDescription className="line-clamp-2">
  //                           {article.excerpt}
  //                         </CardDescription>
  //                       </CardHeader>

  //                       <CardContent>
  //                         <div className="flex flex-wrap gap-2 mb-4">
  //                           {article.tags.map(tag => (
  //                             <span key={tag} className="flex items-center text-xs text-muted-foreground">
  //                               <Tag size={12} className="mr-1" />
  //                               {tag}
  //                             </span>
  //                           ))}
  //                         </div>
  //                       </CardContent>

  //                       <CardFooter className="pt-2 mt-auto flex items-center justify-between">
  //                         <div className="flex items-center">
  //                           <Avatar className="h-8 w-8">
  //                             <img src={article.author.avatar} alt={article.author.name} />
  //                           </Avatar>
  //                           <div className="ml-2 text-sm">
  //                             <p className="font-medium">{article.author.name}</p>
  //                             <p className="text-muted-foreground text-xs">{article.author.role}</p>
  //                           </div>
  //                         </div>

  //                         <div className="flex items-center text-sm text-muted-foreground">
  //                           <CalendarIcon size={14} className="mr-1" />
  //                           <span className="mr-3">
  //                             {formatDistance(new Date(article.createdAt), new Date(), { addSuffix: true })}
  //                           </span>
  //                           <Clock size={14} className="mr-1" />
  //                           <span>{article.readTime} min read</span>
  //                         </div>
  //                       </CardFooter>
  //                     </div>
  //                   </div>
  //                 </Card>
  //               ))}
  //             </div>
  //           </div>
  //         </div>
  //       </>
  //     );
};

export default Articles;
