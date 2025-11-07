import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Listing from '../models/Listing.js';
import RoommateRequest from '../models/RoommateRequest.js';

const ensureParticipant = (conversation, userId) => {
  return conversation.participants.some((participant) => participant.toString() === userId.toString());
};

const populateConversation = async (conversationId) => {
  return Conversation.findById(conversationId)
    .populate('participants', 'name email avatar role')
    .populate('listing', 'title location landlord roommates roomType')
    .populate({
      path: 'roommateRequest',
      select: 'title location budget user roomType',
      populate: { path: 'user', select: 'name email avatar role' },
    })
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'name email avatar role' },
    })
    .lean();
};

export const startConversation = async (req, res) => {
  try {
    const { listingId, participantId, roommateRequestId } = req.body;
    if (!listingId && !roommateRequestId) {
      return res.status(400).json({ success: false, message: 'Provide listingId or roommateRequestId.' });
    }

    const requesterId = req.user._id;
    let otherParticipantId;
    const participantIds = [];
    const contextData = {};

    if (listingId) {
      const listing = await Listing.findById(listingId).select('landlord title');
      if (!listing) {
        return res.status(404).json({ success: false, message: 'Listing not found.' });
      }

      const landlordId = listing.landlord?.toString();
      otherParticipantId = landlordId;

      if (landlordId === requesterId.toString()) {
        if (!participantId) {
          return res.status(400).json({ success: false, message: 'Provide participantId when landlord starts a conversation.' });
        }
        otherParticipantId = participantId;
      }

      contextData.listing = listingId;
    } else if (roommateRequestId) {
      const request = await RoommateRequest.findById(roommateRequestId).select('user title');
      if (!request) {
        return res.status(404).json({ success: false, message: 'Roommate request not found.' });
      }

      const ownerId = request.user?.toString();
      otherParticipantId = ownerId;

      if (ownerId === requesterId.toString()) {
        if (!participantId) {
          return res.status(400).json({ success: false, message: 'Provide participantId when starting a conversation about your own request.' });
        }
        otherParticipantId = participantId;
      }

      contextData.roommateRequest = roommateRequestId;
    }

    if (!otherParticipantId) {
      return res.status(400).json({ success: false, message: 'Conversation requires another participant.' });
    }

    if (otherParticipantId === requesterId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot start a conversation with yourself.' });
    }

    participantIds.push(new mongoose.Types.ObjectId(requesterId));
    participantIds.push(new mongoose.Types.ObjectId(otherParticipantId));

    const conversationFilter = {
      participants: { $all: participantIds },
      $expr: { $eq: [{ $size: '$participants' }, participantIds.length] },
    };

    if (contextData.listing) {
      conversationFilter.listing = contextData.listing;
    }
    if (contextData.roommateRequest) {
      conversationFilter.roommateRequest = contextData.roommateRequest;
    }

    const existingConversation = await Conversation.findOne(conversationFilter);

    const conversation = existingConversation
      ? existingConversation
      : await Conversation.create({
          ...contextData,
          participants: participantIds,
          unreadFor: [],
          lastActivityAt: new Date(),
        });

    const populated = await populateConversation(conversation._id);

    return res.json({ success: true, data: populated });
  } catch (error) {
    console.error('startConversation error:', error);
    return res.status(500).json({ success: false, message: 'Unable to start conversation', error: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .sort({ lastActivityAt: -1 })
      .populate('participants', 'name email avatar role')
      .populate('listing', 'title location landlord roommates roomType')
      .populate({
        path: 'roommateRequest',
        select: 'title location budget user roomType',
        populate: { path: 'user', select: 'name email avatar role' },
      })
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name email avatar role' },
      })
      .lean();

    return res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('getConversations error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load conversations', error: error.message });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { before, limit = 50 } = req.query;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation || !ensureParticipant(conversation, userId)) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const query = { conversation: id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'name email avatar role')
      .lean();

    await Message.updateMany(
      { conversation: id, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    );
    await Conversation.findByIdAndUpdate(id, { $pull: { unreadFor: userId } });

    return res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    console.error('getConversationMessages error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load messages', error: error.message });
  }
};

export const sendConversationMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const userId = req.user._id;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Message body is required.' });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation || !ensureParticipant(conversation, userId)) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const message = await Message.create({
      conversation: id,
      sender: userId,
      body: body.trim(),
      readBy: [userId],
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar role')
      .lean();

    const unreadFor = conversation.participants
      .map((participant) => participant.toString())
      .filter((participant) => participant !== userId.toString());

    conversation.lastMessage = message._id;
    conversation.lastActivityAt = new Date();
    conversation.unreadFor = unreadFor;
    await conversation.save();

    const updatedConversation = await populateConversation(conversation._id);

    return res.status(201).json({
      success: true,
      message: 'Message sent.',
      data: populatedMessage,
      conversation: updatedConversation,
    });
  } catch (error) {
    console.error('sendConversationMessage error:', error);
    return res.status(500).json({ success: false, message: 'Unable to send message', error: error.message });
  }
};

export const markConversationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation || !ensureParticipant(conversation, userId)) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    await Message.updateMany(
      { conversation: id, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    );

    conversation.unreadFor = conversation.unreadFor.filter(
      (participant) => participant.toString() !== userId.toString(),
    );
    await conversation.save();

    return res.json({ success: true, message: 'Conversation marked as read.' });
  } catch (error) {
    console.error('markConversationRead error:', error);
    return res.status(500).json({ success: false, message: 'Unable to mark conversation as read', error: error.message });
  }
};
