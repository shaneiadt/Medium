import { GetStaticPaths, GetStaticProps } from 'next';
import React from 'react'
import { sanityClient } from '../../sanity';
import { Post } from '../../typings';

interface Props {
  post: Post;
}

const Post = ({ post }: Props) => {
  console.log(post);
  return (
    <h1>{post.title}</h1>
  )
}

export default Post;

export const getStaticPaths: GetStaticPaths = async () => {
  const query = `*[_type == "post"]{
    _id,
    slug { current }
  }`;

  const posts = await sanityClient.fetch(query);

  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current
    }
  }));

  return {
    paths,
    fallback: 'blocking'
  };
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `*[_type == "post" && slug.current == "${params?.slug}"][0]{
    _id,
    _createdAt,
    title,
    author->{
      name,
      image
    },
    'comments': *[
      _type == "comment" &&
      post.ref == ^._id &&
      approved == true],
    description,
    mainImage,
    slug,
    body
  }`;

  const post = await sanityClient.fetch(query);

  return {
    props: {
      post
    }
  }
}