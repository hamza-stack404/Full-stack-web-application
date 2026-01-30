# CRITICAL SECURITY FIX: JWT Token Storage

## Issue
JWT tokens are currently stored in localStorage, making them vulnerable to XSS attacks.

## Solution: Move to httpOnly Cookies

### Backend Changes

#### 1. Update login endpoint to set httpOnly cookie
```python
# backend/src/api/auth.py

from fastapi import Response

@router.post("/login")
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # ... existing authentication logic ...

    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )

    # Set httpOnly cookie instead of returning token
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=True,  # Only send over HTTPS
        samesite="lax",  # CSRF protection
        max_age=1800,  # 30 minutes
    )

    return {"message": "Login successful", "token_type": "bearer"}
```

#### 2. Update auth dependency to read from cookie
```python
# backend/src/auth.py

from fastapi import Cookie, HTTPException

def get_current_user(
    access_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    # Remove "Bearer " prefix if present
    token = access_token.replace("Bearer ", "")

    # ... rest of existing logic ...
```

#### 3. Add logout endpoint
```python
# backend/src/api/auth.py

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}
```

### Frontend Changes

#### 1. Update login page
```typescript
// frontend/src/app/login/page.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await login(usernameOrEmail, password);

    // Remove localStorage.setItem('token', ...)
    // Cookie is automatically set by backend

    router.push('/tasks');
  } catch (err: any) {
    // ... error handling ...
  }
};
```

#### 2. Update API client to include credentials
```typescript
// frontend/src/services/auth_service.ts

const authClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,  // Include cookies in requests
});
```

```typescript
// frontend/src/services/task_service.ts

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,  // Include cookies in requests
});

// Remove all getAuthHeader() calls
// Remove all localStorage.getItem('token') calls
```

#### 3. Update CORS configuration
```python
# backend/src/main.py

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Already set, keep it
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

### Benefits
- ✅ XSS attacks cannot access httpOnly cookies
- ✅ Automatic cookie management by browser
- ✅ CSRF protection with SameSite attribute
- ✅ Secure flag ensures HTTPS-only transmission

### Testing
1. Login and verify cookie is set in browser DevTools
2. Verify API calls work without Authorization header
3. Test logout clears cookie
4. Verify cross-site requests are blocked

### Migration Path
1. Deploy backend changes first
2. Update frontend to use new flow
3. Add deprecation notice for old token-based auth
4. Remove localStorage token handling after migration
