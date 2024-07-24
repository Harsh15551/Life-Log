import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

import { isImage } from '../../validImage'

import { createPost, getPosts, updatePost } from '../../services/posts'
import { setLoading } from '../../slices/loaderSlice'
import { setEditPost } from '../../slices/postsSlice'
import { logUserOut } from '../../slices/authSlice'
import { checkUserToken } from '../../services/checkUserToken'
import Loader from '../Loader'
import TagsInput from './TagsInput'

function Form() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { editPost } = useSelector((state) => state.posts)
  const { loading } = useSelector((state) => state.loading)
  const { user } = useSelector((state) => state.auth)

  const [tagInputs, setTagInputs] = useState([])

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    tags: tagInputs,
    selectedFile: '',
  })

  useEffect(() => {
    if (editPost) {
      if (!checkUserToken()) {
        toast.info('Session Expired!')
        dispatch(logUserOut())
        return
      }
      setFormData({
        title: editPost.title,
        message: editPost.message,
        tags: editPost.tags,
        selectedFile: editPost.selectedFile,
      })
      setTagInputs(editPost.tags)
    }
  }, [editPost])

  useEffect(() => {
    if (tagInputs.length >= 1) {
      setFormData((prev) => ({ ...prev, tags: tagInputs }))
    }
  }, [tagInputs])

  const handleOnChange = (e) => {
    if (!checkUserToken()) {
      toast.info('Session Expired!')
      dispatch(logUserOut())
      return
    }
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!isImage(file)) {
      toast.error('Not Valid Image')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, selectedFile: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleOnSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('You are not Logged In!')
      return
    }

    if (!checkUserToken()) {
      toast.info('Session Expired!')
      dispatch(logUserOut())
      return
    }

    setTagInputs([])
    setFormData({
      title: '',
      message: '',
      tags: [],
      selectedFile: '',
    })
    e.target.reset()

    dispatch(setLoading(true))

    const post = {
      ...formData,
      name: user.result.name,
      creator: user.result._id,
      createdAt: new Date().toISOString(),
    }

    if (editPost) {
      dispatch(updatePost(post, editPost._id))
      dispatch(setEditPost(null))
      toast.success('Edited Successfully!')
    } else {
      dispatch(createPost(post))
      toast.success('Posted Successfully!')
    }

    dispatch(getPosts(1))
    navigate('/posts')
    dispatch(setLoading(false))
  }

  const handleClear = (e) => {
    e.preventDefault()
    setFormData({
      title: '',
      message: '',
      tags: '',
      selectedFile: '',
    })
    setTagInputs([])
  }

  const handleCancel = (e) => {
    e.preventDefault()
    dispatch(setEditPost(null))
    setFormData({
      title: '',
      message: '',
      tags: '',
      selectedFile: '',
    })
  }

  const { title, message, tags } = formData

  if (loading) {
    return (
      <div className='w-full min-h-[400px] flex justify-center items-center rounded-lg shadow-lg p-6 transparentCard'>
        <Loader color='#BE185D' />
      </div>
    )
  }

  return (
    <div className='w-full rounded-lg shadow-lg p-6 transparentCard'>
      <p className='text-center mb-4'>
        {!editPost ? 'Creating a Log' : 'Editing Log'}
      </p>
      <form
        autoComplete='off'
        onSubmit={handleOnSubmit}
        className='flex flex-col gap-y-4'
      >
        <input
          type='text'
          name='title'
          required
          disabled={!user}
          value={title}
          onChange={handleOnChange}
          maxLength={60}
          placeholder='Title'
          className='border-[1px] border-slate-400 p-2 rounded-md bg-transparent placeholder:text-gray-700'
        />
        <textarea
          name='message'
          required
          disabled={!user}
          value={message}
          onChange={handleOnChange}
          placeholder='Message'
          className='border-[1px] border-slate-400 p-2 resize-y rounded-md bg-transparent placeholder:text-gray-700'
        />
        <TagsInput
          tagInputs={tagInputs}
          setTagInputs={setTagInputs}
          user={user}
        />
        <input
          type='file'
          onChange={handleImageUpload}
          disabled={!user}
        />
        <div className='w-full flex flex-col space-y-2'>
          <button
            type='submit'
            disabled={!user}
            className='bg-pink-700 text-white cursor-pointer p-2 rounded-md uppercase'
          >
            {!editPost ? 'Submit' : 'Edit'}
          </button>

          {!editPost ? (
            <button
              onClick={handleClear}
              disabled={!user}
              className='bg-blue-600 text-white p-1 rounded-md'
            >
              Clear
            </button>
          ) : (
            <button
              onClick={handleCancel}
              disabled={!user}
              className='bg-blue-600 text-white p-1 rounded-md'
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default Form
