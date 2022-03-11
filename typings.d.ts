export interface Post {
  _id: string
  _createdAt: string
  title: string
  author: {
    name: string
    image: string
  }
  comments: {
    _createdAt: string;
    _id: string;
    name: string;
    email: string;
    comment: string;
  }[],
  description: string
  mainImage: {
    asset: {
      url: string
    }
  }
  slug: {
    current: string
  }
  body: [object]
}
