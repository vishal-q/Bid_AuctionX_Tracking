package com.bidflow.service;

import com.bidflow.model.Discussion;
import com.bidflow.model.DiscussionMessage;
import com.bidflow.model.User;
import com.bidflow.repository.DiscussionMessageRepository;
import com.bidflow.repository.DiscussionRepository;
import com.bidflow.repository.BidRepository;
import com.bidflow.repository.UserRepository;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DiscussionService {

    private final DiscussionRepository discussionRepository;
    private final DiscussionMessageRepository discussionMessageRepository;
    private final BidRepository bidRepository;
    private final UserRepository userRepository;

    public Discussion getOrCreateDiscussionForBid(String bidId) {
        return discussionRepository.findByBidId(bidId)
                .orElseGet(() -> {
                    Discussion d = new Discussion();
                    d.setBidId(bidId);
                    return discussionRepository.save(d);
                });
    }

    public Discussion ensureParticipantsInitialized(String bidId, User currentUser) {
        Discussion d = getOrCreateDiscussionForBid(bidId);

        // Initialize participants from bid (authoritative source)
        var bid = bidRepository.findById(bidId).orElse(null);
        if (bid == null) return d;

        d.setBidId(bidId);
        d.setClientId(bid.getClientId());
        d.setEmployeeId(bid.getAssignedTo());
        return discussionRepository.save(d);
    }

    public DiscussionMessage addMessage(String roomId, String text, User currentUser) {
        Discussion discussion = discussionRepository.findById(roomId).orElse(null);
        if (discussion == null) return null;

        DiscussionMessage msg = new DiscussionMessage();
        msg.setDiscussionId(roomId);
        msg.setBidId(discussion.getBidId());
        msg.setSenderId(currentUser.getId());
        msg.setSenderName(currentUser.getName());
        msg.setSenderRole(currentUser.getRole());
        msg.setText(text);
        msg.setCreatedAt(Instant.now());

        return discussionMessageRepository.save(msg);
    }

    public List<DiscussionMessage> getMessages(String roomId) {
        return discussionMessageRepository.findByDiscussionIdOrderByCreatedAtAsc(roomId);
    }

    public Map<String, Object> asRoomPayload(Discussion d) {
        return Map.of(
                "roomId", d.getId(),
                "bidId", d.getBidId(),
                "clientId", d.getClientId(),
                "employeeId", d.getEmployeeId(),
                "createdAt", d.getCreatedAt()
        );
    }
}

