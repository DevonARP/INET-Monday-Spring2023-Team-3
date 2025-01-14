from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

urlpatterns = [
    path("", views.crawl_create, name="crawl_create"),
    path("all/", views.crawl_get_all, name="crawl_get_all"),
    path(
        "crawl_picture/<str:crawl_id>/",
        views.get_crawl_picture,
        name="get_crawl_picture",
    ),
    path("delete/", views.crawl_delete, name="crawl_delete"),
    path(
        "get_crawl_by_id/<str:crawl_id>/", views.get_crawl_by_id, name="get_crawl_by_id"
    ),
    path(
        "update_crawl_by_id/<str:crawl_id>/",
        views.update_crawl_by_id,
        name="update_crawl_by_id",
    ),
    path(
        "get_crawls_by_author/<str:username>/",
        views.get_crawls_by_author,
        name="get_crawls_by_author",
    ),
    path("crawl_delete_by_id/", views.crawl_delete_by_id, name="crawl_delete_by_id"),
    path(
        "search_crawls_by_author/<str:username>/",
        views.search_crawls_by_author,
        name="search_crawls_by_author",
    ),
    path(
        "search_crawls_by_title/<str:title>/",
        views.search_crawls_by_title,
        name="search_crawls_by_title",
    ),
    path("add_tags_to_crawl/", views.add_tags_to_crawl, name="add_tags_to_crawl"),
    path(
        "search_crawls_by_tag/<str:tag_title>",
        views.search_crawls_by_tag,
        name="search_crawls_by_tag",
    ),
    path(
        "search_crawls_generalized/<str:query>/",
        views.search_crawls_generalized,
        name="search_crawls_generalized",
    ),
    path("get_random_crawl/", views.get_random_crawl, name="get_random_crawl"),
    path(
        "get_random_filtered_crawl/<str:query>/",
        views.get_random_filtered_crawl,
        name="get_random_filtered_crawl",
    ),
    path(
        "review/<str:crawl_id>/",
        views.review_crawl,
        name="review_crawl",
    ),
    path(
        "get_all_reviews/<str:crawl_id>/",
        views.get_all_reviews,
        name="get_all_reviews",
    ),
]


urlpatterns = format_suffix_patterns(urlpatterns)
