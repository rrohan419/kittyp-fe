export interface Author {
    id: string;
    name: string;
    avatar: string;
    role: string;
  }
  
  export interface Comment {
    id: string;
    content: string;
    author: Author;
    createdAt: string;
    likes: number;
    liked?: boolean;
  }
  
  export interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    author: Author;
    category: string;
    tags: string[];
    readTime: number;
    publishedAt: string;
    comments: Comment[];
  }