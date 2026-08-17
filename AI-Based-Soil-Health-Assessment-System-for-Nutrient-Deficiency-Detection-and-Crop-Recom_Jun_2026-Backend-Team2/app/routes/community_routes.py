"""Community posts and social follows API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models import User, CommunityPost, PostLike, Follow
from app.schemas import (
    CommunityPostCreate,
    CommunityPostResponse,
    AuthorResponse,
    ConnectionsResponse,
    ConnectionUserResponse,
)

router = APIRouter(tags=["Community & Social"])


def _format_time(created_at) -> str:
    """Format creation time to a human readable relative duration."""
    if not created_at:
        return "Recent"
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    # Ensure tz info matches or ignore tz for diff
    diff = now - created_at.replace(tzinfo=timezone.utc)
    seconds = int(diff.total_seconds())
    if seconds < 60:
        return "Just now"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} min ago" if minutes == 1 else f"{minutes} mins ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour ago" if hours == 1 else f"{hours} hours ago"
    days = hours // 24
    return f"{days} day ago" if days == 1 else f"{days} days ago"


def _get_user_avatar(username: str | None, email: str) -> str:
    name = username or email.split("@")[0]
    initials = [part[0].upper() for part in name.split() if part]
    return "".join(initials[:2]) if initials else "F"


@router.post(
    "/community/posts",
    response_model=CommunityPostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new community post",
)
def create_post(
    post_data: CommunityPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = CommunityPost(
        user_id=current_user.id,
        content=post_data.content,
        tags=post_data.tags,
        image=post_data.image,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    author = AuthorResponse(
        id=current_user.id,
        name=current_user.username or current_user.email.split("@")[0],
        avatar=_get_user_avatar(current_user.username, current_user.email),
        location=current_user.region or "India",
        followers=current_user.followers_count,
    )

    return CommunityPostResponse(
        id=post.id,
        author=author,
        time="Just now",
        content=post.content,
        image=post.image,
        tags=post.tags,
        likes=0,
        comments=0,
        isLiked=False,
        isSaved=False,
    )


@router.get(
    "/community/posts",
    response_model=list[CommunityPostResponse],
    summary="Get all community posts",
)
def list_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    posts = db.query(CommunityPost).order_by(CommunityPost.created_at.desc()).all()
    response = []

    for post in posts:
        author_user = post.user
        liked = db.query(PostLike).filter(
            PostLike.post_id == post.id,
            PostLike.user_id == current_user.id,
        ).first() is not None

        author = AuthorResponse(
            id=author_user.id,
            name=author_user.username or author_user.email.split("@")[0],
            avatar=_get_user_avatar(author_user.username, author_user.email),
            location=author_user.region or "India",
            followers=author_user.followers_count,
        )

        response.append(
            CommunityPostResponse(
                id=post.id,
                author=author,
                time=_format_time(post.created_at),
                content=post.content,
                image=post.image,
                tags=post.tags,
                likes=len(post.likes),
                comments=0,
                isLiked=liked,
                isSaved=False,
            )
        )

    return response


@router.post(
    "/community/posts/{post_id}/like",
    summary="Like or unlike a community post",
)
def toggle_like(
    post_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    like_state = payload.get("like", True)
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community post not found",
        )

    existing_like = db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == current_user.id,
    ).first()

    if like_state:
        if not existing_like:
            new_like = PostLike(user_id=current_user.id, post_id=post_id)
            db.add(new_like)
            db.commit()
    else:
        if existing_like:
            db.delete(existing_like)
            db.commit()

    return {"message": "Success"}


@router.post(
    "/api/users/{user_id}/follow",
    summary="Follow a user",
)
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself",
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found",
        )

    existing_follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.followed_id == user_id,
    ).first()

    if not existing_follow:
        new_follow = Follow(follower_id=current_user.id, followed_id=user_id)
        db.add(new_follow)
        db.commit()

    return {"message": f"Successfully followed {target_user.username or target_user.email}"}


@router.post(
    "/api/users/{user_id}/unfollow",
    summary="Unfollow a user",
)
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.followed_id == user_id,
    ).first()

    if follow:
        db.delete(follow)
        db.commit()

    return {"message": "Successfully unfollowed"}


@router.get(
    "/api/users/me/connections",
    response_model=ConnectionsResponse,
    summary="Get user connections list",
)
def get_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    followers_list = []
    for f in current_user.followers:
        follower = db.query(User).filter(User.id == f.follower_id).first()
        if follower:
            followers_list.append(
                ConnectionUserResponse(
                    id=follower.id,
                    name=follower.username or follower.email.split("@")[0],
                    avatar=_get_user_avatar(follower.username, follower.email),
                    location=follower.region or "India",
                    role=follower.role,
                )
            )

    following_list = []
    for f in current_user.following:
        followed = db.query(User).filter(User.id == f.followed_id).first()
        if followed:
            following_list.append(
                ConnectionUserResponse(
                    id=followed.id,
                    name=followed.username or followed.email.split("@")[0],
                    avatar=_get_user_avatar(followed.username, followed.email),
                    location=followed.region or "India",
                    role=followed.role,
                )
            )

    return ConnectionsResponse(followers=followers_list, following=following_list)
