import { Article } from "@/pages/Interface/articles";

export const articles: Article[] = [
  {
    id: "1",
    title: "The Complete Guide to Eco-Friendly Cat Litter",
    slug: "complete-guide-eco-friendly-cat-litter",
    excerpt: "Discover the environmental benefits of switching to eco-friendly cat litter and how it can improve your cat's health.",
    content: `
      <h2>Introduction</h2>
      <p>When it comes to caring for our feline friends, choosing the right litter is a decision that impacts not only your home but also the environment. Traditional clay litters contribute millions of pounds of waste to landfills each year, and they're not biodegradable.</p>
      
      <p>Eco-friendly cat litter alternatives offer a sustainable solution without sacrificing effectiveness. In this comprehensive guide, we'll explore the benefits of eco-friendly options, what materials work best, and how to transition your cat successfully.</p>
      
      <h2>Why Choose Eco-Friendly Cat Litter?</h2>
      <p>Conventional clay litters are strip-mined, causing significant environmental damage. Additionally, the sodium bentonite in clumping clay litters doesn't break down in landfills. Eco-friendly alternatives are biodegradable, often made from renewable resources, and many produce less dust—a benefit for both cats and humans with respiratory sensitivities.</p>
      
      <h2>Top Eco-Friendly Materials</h2>
      <ul>
        <li><strong>Wood-Based Litters:</strong> Made from reclaimed lumber industry byproducts, these litters are highly absorbent and naturally control odor.</li>
        <li><strong>Paper Litters:</strong> Created from recycled paper, these are dust-free and gentle on sensitive paws.</li>
        <li><strong>Grass Seed:</strong> A newer alternative that clumps well and is lightweight.</li>
        <li><strong>Walnut Shell:</strong> Made from crushed walnut shells, offering excellent odor control.</li>
        <li><strong>Corn:</strong> Biodegradable and clumpable, though it may attract insects if not changed regularly.</li>
      </ul>
      
      <h2>How to Transition Your Cat</h2>
      <p>Cats are creatures of habit, and sudden changes can cause stress. To transition smoothly:</p>
      <ol>
        <li>Start by mixing a small amount of the new litter with the current one.</li>
        <li>Gradually increase the proportion of the new litter over 1-2 weeks.</li>
        <li>Monitor your cat's reaction and adjust the transition pace accordingly.</li>
      </ol>
      
      <h2>Conclusion</h2>
      <p>Making the switch to eco-friendly cat litter is a small change that creates a significant positive impact on the environment. By choosing sustainable options, you're reducing your carbon pawprint while still providing excellent care for your feline companion.</p>
    `,
    coverImage: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    author: {
      id: "1",
      name: "Dr. Emma Wilson",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      role: "Veterinarian"
    },
    category: "Pet Care",
    tags: ["eco-friendly", "cats", "sustainability"],
    readTime: 8,
    publishedAt: "2025-03-15T10:30:00Z",
    comments: [
      {
        id: "c1",
        content: "I switched to pine pellet litter last year and it's been amazing! Less tracking and much better odor control.",
        author: {
          id: "u2",
          name: "Sarah Johnson",
          avatar: "https://randomuser.me/api/portraits/women/22.jpg",
          role: "Cat Owner"
        },
        createdAt: "2025-03-16T14:25:00Z",
        likes: 12
      },
      {
        id: "c2",
        content: "Has anyone tried the grass seed litter? I'm curious if it's worth the higher price point.",
        author: {
          id: "u3",
          name: "Michael Chen",
          avatar: "https://randomuser.me/api/portraits/men/34.jpg",
          role: "Pet Enthusiast"
        },
        createdAt: "2025-03-17T09:15:00Z",
        likes: 8
      }
    ]
  },
  {
    id: "2",
    title: "Understanding Your Cat's Behavior: What Their Litter Box Habits Tell You",
    slug: "understanding-cat-behavior-litter-box-habits",
    excerpt: "Learn to interpret your cat's litter box behavior and identify potential health issues early.",
    content: `
      <h2>Introduction</h2>
      <p>Your cat's litter box habits can provide valuable insights into their health and wellbeing. Changes in these habits often serve as early warning signs for various medical conditions, making it crucial for cat owners to pay attention to these behaviors.</p>
      
      <h2>Normal Litter Box Behavior</h2>
      <p>Most healthy adult cats will use the litter box 1-3 times daily for defecation and 2-5 times for urination. Knowing your cat's normal pattern establishes a baseline that helps you notice changes.</p>
      
      <h2>Warning Signs to Watch For</h2>
      <ul>
        <li><strong>Frequent Trips:</strong> Multiple, unproductive visits to the litter box may indicate a urinary tract infection or blockage.</li>
        <li><strong>Avoiding the Box:</strong> When a previously well-trained cat starts eliminating outside the box, it could signal anxiety, territorial issues, or health problems.</li>
        <li><strong>Vocalization:</strong> Crying while using the litter box often indicates pain and requires immediate veterinary attention.</li>
        <li><strong>Changes in Output:</strong> Blood in urine or stool, diarrhea, constipation, or significantly increased or decreased volume are all reasons to consult your vet.</li>
      </ul>
      
      <h2>Behavioral Causes</h2>
      <p>Not all litter box issues stem from medical conditions. Sometimes the cause is behavioral:</p>
      <ul>
        <li>Stress or anxiety from household changes</li>
        <li>Dirty litter box conditions</li>
        <li>Litter type preferences</li>
        <li>Box location or accessibility problems</li>
      </ul>
      
      <h2>When to See the Vet</h2>
      <p>Contact your veterinarian immediately if you notice:</p>
      <ul>
        <li>Straining without producing urine (particularly in male cats – this is an emergency)</li>
        <li>Blood in urine or stool</li>
        <li>Crying during elimination</li>
        <li>Complete cessation of litter box use</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>Being attentive to your cat's litter box habits is an essential part of responsible pet ownership. By understanding what's normal for your cat and promptly addressing changes, you can help ensure their long-term health and wellbeing.</p>
    `,
    coverImage: "https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    author: {
      id: "3",
      name: "Dr. James Peterson",
      avatar: "https://randomuser.me/api/portraits/men/42.jpg",
      role: "Animal Behaviorist"
    },
    category: "Pet Health",
    tags: ["cat behavior", "pet health", "litter box"],
    readTime: 6,
    publishedAt: "2025-04-02T08:45:00Z",
    comments: [
      {
        id: "c3",
        content: "This article saved my cat's life. I noticed him straining and took him to the vet immediately - he had a urinary blockage!",
        author: {
          id: "u4",
          name: "Taylor Rodriguez",
          avatar: "https://randomuser.me/api/portraits/men/67.jpg",
          role: "Cat Parent"
        },
        createdAt: "2025-04-03T16:20:00Z",
        likes: 24
      }
    ]
  },
  {
    id: "3",
    title: "Sustainable Pet Ownership: Reducing Your Cat's Carbon Pawprint",
    slug: "sustainable-pet-ownership-reducing-cats-carbon-pawprint",
    excerpt: "Simple, practical ways to make your cat care routine more environmentally friendly without compromising on quality.",
    content: `
      <h2>Introduction</h2>
      <p>As environmental consciousness grows, many pet owners are looking for ways to reduce the ecological impact of their pets. While cats are relatively low-impact pets compared to some others, there are still many opportunities to make cat ownership more sustainable.</p>
      
      <h2>Eco-Friendly Litter Options</h2>
      <p>Traditional clay litter contributes significantly to environmental harm through mining and landfill waste. Consider these alternatives:</p>
      <ul>
        <li>Biodegradable litters made from wood, paper, corn, or walnut shells</li>
        <li>Litters made from recycled materials</li>
        <li>Compostable options (for non-fecal waste only, following safety guidelines)</li>
      </ul>
      
      <h2>Sustainable Feeding Practices</h2>
      <p>The pet food industry has a substantial environmental footprint. Make more sustainable choices by:</p>
      <ul>
        <li>Choosing brands that use sustainably sourced ingredients</li>
        <li>Buying in bulk to reduce packaging waste</li>
        <li>Looking for recycled and recyclable packaging</li>
        <li>Avoiding food waste through proper storage and portion control</li>
      </ul>
      
      <h2>Toys and Accessories</h2>
      <p>Plastic pet toys often end up in landfills. Instead:</p>
      <ul>
        <li>Choose toys made from natural, biodegradable materials</li>
        <li>DIY toys from household items</li>
        <li>Invest in durable, long-lasting products rather than disposable ones</li>
        <li>Donate gently used items rather than discarding them</li>
      </ul>
      
      <h2>Waste Management</h2>
      <p>Proper waste handling is crucial for minimizing environmental impact:</p>
      <ul>
        <li>Use biodegradable waste bags</li>
        <li>Consider a specialized pet waste composter (separate from your garden compost)</li>
        <li>Never flush cat waste (it can contain harmful parasites)</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>Every small change adds up when it comes to sustainable pet care. By making mindful choices about litter, food, toys, and waste management, you can significantly reduce your cat's environmental impact while still providing excellent care.</p>
    `,
    coverImage: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    author: {
      id: "5",
      name: "Olivia Green",
      avatar: "https://randomuser.me/api/portraits/women/63.jpg",
      role: "Environmental Consultant"
    },
    category: "Sustainability",
    tags: ["eco-friendly", "sustainable living", "pet care"],
    readTime: 7,
    publishedAt: "2025-03-25T13:15:00Z",
    comments: [
      {
        id: "c5",
        content: "I never realized how much waste my cat's products were creating! I've switched to bamboo litter boxes and they're fantastic.",
        author: {
          id: "u5",
          name: "Jamie Winters",
          avatar: "https://randomuser.me/api/portraits/women/15.jpg",
          role: "Environmentalist"
        },
        createdAt: "2025-03-26T10:05:00Z",
        likes: 15
      },
      {
        id: "c6",
        content: "Does anyone have recommendations for sustainable cat food brands that don't cost a fortune?",
        author: {
          id: "u6",
          name: "Alex Morgan",
          avatar: "https://randomuser.me/api/portraits/women/32.jpg",
          role: "Budget-conscious Pet Owner"
        },
        createdAt: "2025-03-27T16:40:00Z",
        likes: 10
      }
    ]
  }
];

export const getArticleBySlug = (slug: string) => {
  return articles.find(article => article.slug === slug);
};

export const getArticleById = (id: string) => {
  return articles.find(article => article.id === id);
};