import { GetStaticPaths, GetStaticProps } from 'next';
import React, { useState } from 'react'
import PortableText from 'react-portable-text';
import { useForm, SubmitHandler } from 'react-hook-form';

import { Header } from '../../components/Header';
import { sanityClient, urlFor } from '../../sanity';
import { Post } from '../../typings';

interface Props {
  post: Post;
}

interface IFormInput {
  _id: string;
  name: string;
  email: string;
  comment: string;
}

const Post = ({ post: { _id, mainImage, title, description, author, _createdAt, body, comments } }: Props) => {
  const { register, handleSubmit, formState: { errors } } = useForm<IFormInput>();
  const [submitted, setSubmitted] = useState(false);

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    await fetch('/api/createComment', {
      method: 'POST',
      body: JSON.stringify(data)
    }).then(() => {
      console.log(data);
      setSubmitted(true);
    }).catch(e => {
      console.error(e);
      setSubmitted(false);
    })
  }

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

      <hr className='max-w-lg mx-auto my-5 border border-yellow-500' />

      {submitted ? (
        <div className='p-10 my-10 bg-yellow-500 text-white'>
          <h3 className='text-3xl font-bold'>Thank you for submitting your comment!</h3>
          <p>Once it has been approved, it will appear below.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col p-5 my-10 max-w-2xl mx-auto mb-10'>
          <h3 className='text-yellow-500 text-sm'>Enjoyed this article?</h3>
          <h3 className='font-bold text-3xl'>Leave a comment below!</h3>
          <hr className='py-3 mt-2' />

          <input
            {...register('_id')}
            type="hidden"
            name='_id'
            value={_id}
          />

          <label className='block mb-5'>
            <span className='text-gray-700'>Name</span>
            <input
              {...register('name', { required: true })}
              className='shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring-1'
              type="text"
              placeholder='John Smith'
            />
          </label>
          <label className='block mb-5'>
            <span className='text-gray-700'>Email</span>
            <input {...register('email', { required: true })} className='shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring-1' type="email" placeholder='John Smith' />
          </label>
          <label className='block mb-5'>
            <span className='text-gray-700'>Comment</span>
            <textarea {...register('comment', { required: true })} className='shadow border rounded py-2 px-3 form-textarea mt-1 block w-full ring-yellow-500 outline-none focus:ring-1' rows={8} />
          </label>

          <div className='flex flex-col p-5'>
            {errors.name && <span className='text-red-500'>The Name Field is required</span>}
            {errors.comment && <span className='text-red-500'>The Comment Field is required</span>}
            {errors.email && <span className='text-red-500'>The Email Field is required</span>}
          </div>

          <input type="submit" className='shadow bg-yellow-500 hover:bg-yellow-400 focus:shadow-outline focus:outline-none text-white font-bold rounded cursor-pointer px-4 py-2' />
        </form>
      )}

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
      references(^._id) &&
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