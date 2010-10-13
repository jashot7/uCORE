#import os
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib import auth

from coreo.ucore.models import Skin, CoreUser


def index(request):
  # XXX the django dev server can't use ssl, so fake getting the sid from the cert
  # XXX pull out the name as well. pass it to register() and keep things DRY
  # sid = os.getenv('SSL_CLIENT_S_DN_CN', '').split(' ')[-1]
  sid = 'jlcoope'

  if not sid: return render_to_response('install_certs.html')

  if not request.user.is_authenticated():
    return render_to_response('login.html', context_instance=RequestContext(request))

  try:
    user = CoreUser.objects.get(username=request.user.username)
  except CoreUser.DoesNotExist:
    #XXX send them to the register page instead
    return render_to_response('login.html', context_instance=RequestContext(request))
  
  return render_to_response('index.html', {'user': user}, context_instance=RequestContext(request))


def register(request, sid):
  ''' Pull out the user's sid, name, email, and phone number from the user's certs.
      Return a pre-filled registration form with this info so the user can create an account.
  '''
  # get the sid and name from the cert
  #name_sid = os.getenv('SSL_CLIENT_S_DN_CN', '').split(' ')
  #name = ' '.join(name_sid[:-1])
  #sid = name_sid[-1]

  # XXX in the future we'll be returning more info (sid, name, email, phone number).
  # The user will basically just need to verify the info and put in some basic additional
  # info (main areas of interest, skin, etc).
  return render_to_response('register.html', {'sid': sid}, context_instance=RequestContext(request))


def save_user(request):
  ''' Create/update the user's record in the DB.
  '''
  sid = request.POST['sid'].strip()
  username = request.POST['username'].strip()
  first_name = request.POST['first_name'].strip()
  last_name = request.POST['last_name'].strip()
  password = request.POST['password'].strip()
  email = request.POST['email'].strip()
  phone_number = request.POST['phone_number'].strip()

  if not (sid and username and first_name and last_name and password and email and phone_number):
    # redisplay the registration page
    return render_to_response('register.html',
        {'sid': sid,
         'error_message': 'Please fill in all required fields.'
        }, context_instance=RequestContext(request))

  # XXX currently User.phone_number is stored as an int
  #   1. keep as an int
  #   2. change from an int to a CharField
  # either way, we should use regex to check before we put it into the DB

  # save the new user to the DB with the default skin
  default_skin = Skin.objects.get(name='Default')
  user = CoreUser(sid=sid, username=username, first_name=first_name, last_name=last_name, email=email, phone_number=phone_number, skin=default_skin)
  user.set_password(password)
  user.save()

  # return an HttpResponseRedirect so that the data can't be POST'd twice if the user
  # hits the back button
  return HttpResponseRedirect(reverse('coreo.ucore.views.index'))


def login(request):
  return render_to_response('login.html', context_instance=RequestContext(request))


def login_user(request):
  ''' Authenticate a user via Username/Password
  '''
  username = request.POST['username'].strip()
  password = request.POST['password'].strip()

  user = auth.authenticate(username=username, password=password)

  if user is not None:
    auth.login(request, user)
    return HttpResponseRedirect(reverse('coreo.ucore.views.index'))
  
  return render_to_response('login.html',
        { 'error_message': 'Invalid Username/Password Combination'
        }, context_instance=RequestContext(request))


def logout_user(request):
  '''Log the user out, terminating the session
  '''
  if request.user.is_authenticated():
    auth.logout(request)

  return HttpResponseRedirect(reverse('coreo.ucore.views.index'))

