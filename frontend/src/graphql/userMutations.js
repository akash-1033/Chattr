export const SIGNUP_MUTATION = `
  mutation Signup($fullName: String!, $email: String!, $password: String!, $bio: String) {
    signup(fullName: $fullName, email: $email, password: $password, bio: $bio) {
      user {
        id
        fullName
        email
        bio
        profilePic
      }
    }
  }
`;

export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        id
        fullName
        email
        bio
        profilePic
      }
    }
  }
`;

export const LOGOUT_MUTATION = `
  mutation {
    logout
  }
`;

export const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile(
    $fullName: String
    $bio: String
    $fileBuffer: String
    $contentType: String
    $fileName: String
  ) {
    updateProfile(
      fullName: $fullName
      bio: $bio
      fileBuffer: $fileBuffer
      contentType: $contentType
      fileName: $fileName
    ) {
      id
      fullName
      bio
      profilePicUrl
    }
  }
`;