import { GetStaticPaths, GetStaticProps } from 'next';
import React from 'react'
import PortableText from 'react-portable-text';

import { Header } from '../../components/Header';
import { sanityClient, urlFor } from '../../sanity';
import { Post } from '../../typings';

interface Props {
  post: Post;
}

const Post = ({ post: { mainImage, title, description, author, _createdAt, body } }: Props) => {
  return (
    <main>
      <Header />

      <img className='w-full h-40 object-cover' src={urlFor(mainImage).url()} alt={title} />

      <article className='max-w-3xl mx-auto p-5'>
        <h1 className='text-3xl mt-10 mb-3'>{title}</h1>
        <h2 className='text-xl font-light text-gray-500 mb-2'>{description}</h2>

        <div className='flex items-center space-x-2'>
          <img className='h-10 w-10 rounded-full' src={urlFor(author.image).url()} alt={author.name} />
          <p className='font-extralight text-sm'>Bloy post by <span className='text-green-600'>{author.name}</span> - Published at {new Date(_createdAt).toLocaleString()}</p>
        </div>

        <div className='mt-10'>
          <PortableText
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
            content={body}
            serializers={
              {
                h1: (props: any) => <h1 className='text-2xl font-bold my-5' {...props} />,
                h2: (props: any) => <h2 className='text-xl font-bold my-5' {...props} />,
                li: ({ children }: any) => <li className='ml-4 list-disc'>{children}</li>,
                link: ({ href, children }: any) => <a href={href} target='_blank' className='text-blue-500 hover:underline'>{children}</a>,
              }
            }
          />
        </div>
      </article>
    </main>
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

  if (Object.keys(post).length === 0) return { notFound: true };

  return {
    props: {
      post
    },
    revalidate: 86400, // after 1 day cache will update/revalidate (ISR)
  }
}