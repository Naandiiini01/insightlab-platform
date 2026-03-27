from django.urls import path
from . import views

urlpatterns = [
    # Studies
    path('', views.study_list),
    path('<uuid:pk>/', views.study_detail),
    path('<uuid:pk>/publish/', views.study_publish),
    path('<uuid:pk>/unpublish/', views.study_unpublish),
    path('<uuid:pk>/duplicate/', views.study_duplicate),
    # Blocks
    path('<uuid:study_pk>/blocks/', views.block_create),
    path('<uuid:study_pk>/blocks/reorder/', views.blocks_reorder),
    path('<uuid:study_pk>/blocks/<uuid:block_pk>/', views.block_detail),
    # Media
    path('<uuid:study_pk>/media/', views.media_upload),
    # Public participant access
    path('public/<uuid:token>/', views.study_public),
]
